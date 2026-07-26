import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentProvider, PaymentStatus, TransactionStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  assertStripePaymentIntentShape,
  assertStripeSessionShape,
  constructStripeWebhookEvent,
  isSupportedSuccessfulStripeEvent,
  normalizeStripeCurrency,
  retrieveStripePaymentIntent,
  StripeConfigurationError,
  StripeVerificationError,
  toStripeMinorUnits,
} from "@/lib/payments/providers/stripe";

async function handleStripeWebhook(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Stripe signature is required." }, { status: 400 });
  }

  let event;

  try {
    const rawBody = await request.text();
    event = constructStripeWebhookEvent(rawBody, signature);
  } catch (error) {
    const status = error instanceof StripeConfigurationError ? 503 : 400;
    return NextResponse.json({ error: "Stripe webhook verification failed." }, { status });
  }

  if (!isSupportedSuccessfulStripeEvent(event)) {
    return NextResponse.json({ received: true, status: "ignored_event" });
  }

  const session = event.data.object;

  if (event.type === "checkout.session.completed" && session.payment_status !== "paid") {
    return NextResponse.json({ received: true, status: "ignored_unpaid_session" });
  }

  try {
    const verified = assertStripeSessionShape(session);
    const paymentIntent = await retrieveStripePaymentIntent(verified.paymentIntentId);
    const verifiedIntent = assertStripePaymentIntentShape(paymentIntent, verified);

    const result = await prisma.$transaction(async (tx) => {
      const duplicateEvent = await tx.processedPaymentEvent.findUnique({
        where: {
          provider_eventId: {
            provider: PaymentProvider.STRIPE,
            eventId: event.id,
          },
        },
        select: { id: true },
      });

      if (duplicateEvent) {
        return "duplicate_event";
      }

      const payment = await tx.paymentTransaction.findUnique({
        where: { transactionId: verified.sessionId },
        include: { order: true },
      });

      if (!payment) {
        throw new StripeVerificationError("Stripe transaction was not initiated by this store.");
      }
      if (
        payment.provider !== PaymentProvider.STRIPE ||
        payment.order.paymentProvider !== PaymentProvider.STRIPE
      ) {
        throw new StripeVerificationError("Payment provider mismatch.");
      }
      if (
        payment.orderId !== verified.orderId ||
        payment.order.id !== verified.orderId
      ) {
        throw new StripeVerificationError("Order ID mismatch.");
      }

      const paymentCurrency = normalizeStripeCurrency(payment.currency);
      const orderCurrency = normalizeStripeCurrency(payment.order.currency);
      const expectedAmount = toStripeMinorUnits(payment.amount, paymentCurrency);
      const orderAmount = toStripeMinorUnits(payment.order.grandTotal, orderCurrency);

      if (
        expectedAmount !== orderAmount ||
        verified.amountTotal !== expectedAmount ||
        verifiedIntent.amountReceived !== expectedAmount
      ) {
        throw new StripeVerificationError("Payment amount mismatch.");
      }
      if (
        paymentCurrency !== verified.currency ||
        orderCurrency !== verified.currency ||
        verifiedIntent.currency !== verified.currency
      ) {
        throw new StripeVerificationError("Payment currency mismatch.");
      }

      if (
        payment.status === TransactionStatus.VERIFIED &&
        payment.order.paymentStatus === PaymentStatus.PAID
      ) {
        await tx.processedPaymentEvent.create({
          data: {
            provider: PaymentProvider.STRIPE,
            eventId: event.id,
            paymentTransactionId: payment.id,
            eventType: event.type,
          },
        });
        return "already_verified";
      }

      const claimed = await tx.paymentTransaction.updateMany({
        where: {
          id: payment.id,
          status: { not: TransactionStatus.VERIFIED },
        },
        data: {
          status: TransactionStatus.VERIFIED,
          providerReference: verified.paymentIntentId,
          verifiedAt: new Date(),
          failureReason: null,
          rawMetadataJson: JSON.stringify({
            eventId: event.id,
            eventType: event.type,
            sessionId: verified.sessionId,
            paymentIntentId: verified.paymentIntentId,
          }),
        },
      });

      if (claimed.count !== 1) {
        await tx.processedPaymentEvent.create({
          data: {
            provider: PaymentProvider.STRIPE,
            eventId: event.id,
            paymentTransactionId: payment.id,
            eventType: event.type,
          },
        });
        return "already_verified";
      }

      await tx.processedPaymentEvent.create({
        data: {
          provider: PaymentProvider.STRIPE,
          eventId: event.id,
          paymentTransactionId: payment.id,
          eventType: event.type,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentReference: verified.paymentIntentId,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: payment.order.status,
          paymentStatus: PaymentStatus.PAID,
          note: `Stripe payment verified (${event.type}).`,
        },
      });

      return "verified";
    });

    return NextResponse.json({ received: true, status: result });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ received: true, status: "duplicate_event" });
    }

    const status = error instanceof StripeVerificationError ? 400 : 500;
    return NextResponse.json({ error: "Stripe payment verification failed." }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;

    if (rawProvider.toLowerCase() === "stripe") {
      return handleStripeWebhook(request);
    }

    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;

    const payload = await request.json();

    // Verify webhook signature or reference
    const orderNumber = payload.orderNumber || payload.data?.object?.client_reference_id;
    if (!orderNumber) {
      return NextResponse.json({ received: true, status: "ignored_no_order" });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({ received: true, status: "already_paid" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id, provider: providerEnum },
        data: {
          status: TransactionStatus.VERIFIED,
          verifiedAt: new Date(),
          rawMetadataJson: JSON.stringify(payload),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          paymentStatus: PaymentStatus.PAID,
          note: `Webhook payment notification verified for ${providerEnum}`,
        },
      });
    });

    return NextResponse.json({ received: true, status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
