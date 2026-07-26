import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentProvider, PaymentStatus } from "@/generated/prisma/enums";
import { getPaymentAdapter } from "@/lib/payments/payment-service";
import {
  assertStripePaymentIntentShape,
  assertStripeSessionShape,
  normalizeStripeCurrency,
  retrieveStripeCheckoutSession,
  retrieveStripePaymentIntent,
  StripeVerificationError,
  toStripeMinorUnits,
} from "@/lib/payments/providers/stripe";

async function handleStripeCallback(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("session_id");

    if (!sessionId) {
      throw new StripeVerificationError("Stripe Checkout Session ID is missing.");
    }

    // The query parameter is only an opaque lookup key. All payment facts come
    // from Stripe's authenticated API response and our own database records.
    const session = await retrieveStripeCheckoutSession(sessionId);
    const verified = assertStripeSessionShape(session);
    const paymentIntent = await retrieveStripePaymentIntent(verified.paymentIntentId);
    const verifiedIntent = assertStripePaymentIntentShape(paymentIntent, verified);
    const payment = await prisma.paymentTransaction.findUnique({
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
    if (payment.orderId !== verified.orderId || payment.order.id !== verified.orderId) {
      throw new StripeVerificationError("Order ID mismatch.");
    }

    const paymentCurrency = normalizeStripeCurrency(payment.currency);
    const orderCurrency = normalizeStripeCurrency(payment.order.currency);
    const transactionAmount = toStripeMinorUnits(payment.amount, paymentCurrency);
    const orderAmount = toStripeMinorUnits(payment.order.grandTotal, orderCurrency);

    if (
      transactionAmount !== orderAmount ||
      verified.amountTotal !== transactionAmount ||
      verifiedIntent.amountReceived !== transactionAmount
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

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderNumber=${payment.order.orderNumber}`,
    );
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=payment_verification_failed`,
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;

    if (rawProvider.toLowerCase() === "stripe") {
      return handleStripeCallback(request);
    }

    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;

    const contentType = request.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const searchParams = new URLSearchParams(text);
      payload = Object.fromEntries(searchParams.entries());
    } else {
      payload = await request.json();
    }

    const adapter = getPaymentAdapter(providerEnum);
    const verification = await adapter.verifyPayment(payload);

    const orderNumber =
      (payload.tran_id as string) ||
      (payload.client_reference_id as string) ||
      (payload.orderNumber as string);

    if (!orderNumber) {
      return NextResponse.json({ error: "Order reference missing in callback" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency check: if order is already paid, ignore duplicate callback
    if (order.paymentStatus === PaymentStatus.PAID && verification.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderNumber=${order.orderNumber}`);
    }

    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.paymentTransaction.findFirst({
        where: { orderId: order.id, provider: providerEnum },
      });

      if (existingTx) {
        await tx.paymentTransaction.update({
          where: { id: existingTx.id },
          data: {
            status: verification.status,
            providerReference: verification.providerReference || existingTx.providerReference,
            verifiedAt: verification.success ? new Date() : undefined,
            failedAt: !verification.success ? new Date() : undefined,
            failureReason: verification.failureReason || null,
            rawMetadataJson: verification.rawMetadataJson || null,
          },
        });
      }

      const newPaymentStatus = verification.success ? PaymentStatus.PAID : PaymentStatus.FAILED;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          paymentStatus: newPaymentStatus,
          note: `${providerEnum} callback processed: ${
            verification.success ? "Payment Successful" : verification.failureReason || "Payment Failed"
          }`,
        },
      });
    });

    if (verification.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderNumber=${order.orderNumber}`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=payment_failed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Callback processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  return POST(request, props);
}
