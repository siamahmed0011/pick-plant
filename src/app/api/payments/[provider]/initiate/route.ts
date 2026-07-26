import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { getPaymentAdapter } from "@/lib/payments/payment-service";
import {
  isMissingStripeResource,
  retrieveStripeCheckoutSession,
  sanitizedStripeErrorContext,
  StripeVerificationError,
} from "@/lib/payments/providers/stripe";

type StripeOrder = {
  id: string;
  orderNumber: string;
  grandTotal: Prisma.Decimal;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentStatus: string;
};

async function prepareStripeAttempt(orderId: string, remainingRetries = 2) {
  const payment = await prisma.paymentTransaction.findFirst({
    where: { orderId, provider: PaymentProvider.STRIPE },
  });

  if (!payment) {
    return { error: "missing_transaction" } as const;
  }
  if (payment.status === TransactionStatus.VERIFIED) {
    return { error: "already_verified" } as const;
  }

  if (payment.transactionId?.startsWith("cs_")) {
    try {
      const session = await retrieveStripeCheckoutSession(payment.transactionId);
      const isActive =
        session.mode === "payment" &&
        session.status === "open" &&
        session.expires_at * 1000 > Date.now() &&
        Boolean(session.url);

      if (isActive) {
        return {
          paymentTransactionId: payment.id,
          idempotencyKey: payment.idempotencyKey,
          existingSession: session,
        } as const;
      }

      if (
        session.mode === "payment" &&
        session.status === "complete" &&
        session.payment_status === "paid"
      ) {
        return { error: "already_completed" } as const;
      }
    } catch (error) {
      const isInvalidLocalSession = error instanceof StripeVerificationError;

      if (!isMissingStripeResource(error) && !isInvalidLocalSession) {
        console.error(
          "Stripe Checkout Session retrieval failed.",
          sanitizedStripeErrorContext(error, {
            orderId,
          }),
        );
        return { error: "stripe_unavailable" } as const;
      }
    }
  }

  const reusableAttemptKey =
    !payment.transactionId?.startsWith("cs_") &&
    payment.idempotencyKey?.startsWith(`checkout:${orderId}:`)
      ? payment.idempotencyKey
      : null;

  if (reusableAttemptKey) {
    return {
      paymentTransactionId: payment.id,
      idempotencyKey: reusableAttemptKey,
      existingSession: null,
    } as const;
  }

  const attemptId = randomUUID();
  const idempotencyKey = `checkout:${orderId}:${attemptId}`;
  const claimed = await prisma.paymentTransaction.updateMany({
    where: {
      id: payment.id,
      attemptNumber: payment.attemptNumber,
      transactionId: payment.transactionId,
      idempotencyKey: payment.idempotencyKey,
      status: { not: TransactionStatus.VERIFIED },
    },
    data: {
      attemptNumber: { increment: 1 },
      idempotencyKey,
      transactionId: null,
      providerReference: null,
      status: TransactionStatus.INITIATED,
      failureReason: null,
      failedAt: null,
    },
  });

  if (claimed.count !== 1) {
    if (remainingRetries > 0) {
      return prepareStripeAttempt(orderId, remainingRetries - 1);
    }
    return { error: "attempt_conflict" } as const;
  }

  return {
    paymentTransactionId: payment.id,
    idempotencyKey,
    existingSession: null,
  } as const;
}

async function initiateStripePayment(order: StripeOrder, rawProvider: string) {
  if (order.paymentStatus === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "This order is already paid." },
      { status: 409 },
    );
  }

  const adapter = getPaymentAdapter(PaymentProvider.STRIPE);

  if (!adapter.isEnabled()) {
    return NextResponse.json(
      { error: "Stripe payment is temporarily unavailable." },
      { status: 503 },
    );
  }

  const attempt = await prepareStripeAttempt(order.id);

  if ("error" in attempt) {
    const status = attempt.error === "stripe_unavailable" ? 503 : 409;
    return NextResponse.json(
      { error: "Stripe payment attempt is not available." },
      { status },
    );
  }

  if (attempt.existingSession?.url) {
    return NextResponse.json({
      success: true,
      redirectUrl: attempt.existingSession.url,
      transactionId: attempt.existingSession.id,
      reused: true,
    });
  }

  if (!attempt.idempotencyKey) {
    return NextResponse.json(
      { error: "Stripe payment attempt could not be prepared." },
      { status: 409 },
    );
  }

  const result = await adapter.initiatePayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.grandTotal),
    currency: order.currency,
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail || "customer@example.com",
    customerPhone: order.customerPhone || "N/A",
    returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/${rawProvider.toLowerCase()}/callback`,
    idempotencyKey: attempt.idempotencyKey,
  });

  if (!result.success || !result.transactionId || !result.redirectUrl) {
    return NextResponse.json(
      { error: "Stripe Checkout Session could not be created." },
      { status: 502 },
    );
  }

  const updated = await prisma.paymentTransaction.updateMany({
    where: {
      id: attempt.paymentTransactionId,
      provider: PaymentProvider.STRIPE,
      idempotencyKey: attempt.idempotencyKey,
      status: { not: TransactionStatus.VERIFIED },
    },
    data: {
      transactionId: result.transactionId,
    },
  });

  if (updated.count !== 1) {
    return NextResponse.json(
      { error: "Stripe payment attempt could not be finalized." },
      { status: 409 },
    );
  }

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  let isStripeRequest = false;

  try {
    const session = await auth();
    const { provider: rawProvider } = await params;
    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;
    isStripeRequest = providerEnum === PaymentProvider.STRIPE;

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      providerEnum === PaymentProvider.STRIPE &&
      order.paymentProvider !== PaymentProvider.STRIPE
    ) {
      return NextResponse.json(
        { error: "This order was not created for Stripe payment." },
        { status: 400 },
      );
    }

    // Ownership check: if order belongs to a user, verify session
    if (order.userId && session?.user?.id !== order.userId && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    if (providerEnum === PaymentProvider.STRIPE) {
      return initiateStripePayment(order, rawProvider);
    }

    const adapter = getPaymentAdapter(providerEnum);
    if (!adapter.isEnabled()) {
      return NextResponse.json(
        { error: `${providerEnum} online payment gateway is disabled or missing configuration credentials.` },
        { status: 400 }
      );
    }

    const result = await adapter.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.grandTotal),
      currency: order.currency,
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "customer@example.com",
      customerPhone: order.customerPhone || "N/A",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/${rawProvider.toLowerCase()}/callback`,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (isStripeRequest) {
      console.error(
        "Stripe payment initiation failed.",
        sanitizedStripeErrorContext(error, { route: "payment-initiation" }),
      );
      return NextResponse.json(
        { error: "Stripe payment initiation failed." },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to initiate payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
