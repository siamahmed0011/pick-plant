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
import {
  fingerprintSSLCommerzValue,
  sanitizedSSLCommerzErrorContext,
  SSLCommerzConfigurationError,
  SSLCommerzProofError,
  SSLCommerzProviderUnavailableError,
} from "@/lib/payments/providers/sslcommerz";
import {
  isSubmittedSSLCommerzFailure,
  readSSLCommerzRequestPayload,
  reconcileSSLCommerzPayment,
} from "@/lib/payments/sslcommerz-reconciliation";
import {
  confirmOrderPaymentWithinReservation,
  PaymentReservationUnavailableError,
} from "@/lib/orders/payment-release-fence";

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

      const paidOrder = await confirmOrderPaymentWithinReservation(tx, {
        orderId: payment.orderId,
        provider: PaymentProvider.STRIPE,
        paymentReference: verified.paymentIntentId,
      });
      if (paidOrder.count !== 1) {
        throw new PaymentReservationUnavailableError(
          "The order reservation is no longer payable.",
        );
      }

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
    if (error instanceof PaymentReservationUnavailableError) {
      return NextResponse.json({
        received: true,
        status: "ignored_unavailable_reservation",
      });
    }

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

async function handleSSLCommerzWebhook(request: Request) {
  let validationId: string | null = null;

  try {
    const payload = await readSSLCommerzRequestPayload(request);
    validationId =
      typeof payload.val_id === "string" && payload.val_id.trim()
        ? payload.val_id.trim()
        : null;

    if (isSubmittedSSLCommerzFailure(payload)) {
      return NextResponse.json({
        received: true,
        status: "ignored_unverified_failure",
      });
    }

    const result = await reconcileSSLCommerzPayment(payload, "ipn");

    return NextResponse.json({
      received: true,
      status: result.outcome,
      paymentConfirmed: result.paymentConfirmed,
    });
  } catch (error) {
    if (error instanceof SSLCommerzProofError) {
      return NextResponse.json(
        { error: "SSLCommerz payment proof is invalid." },
        { status: 400 },
      );
    }

    if (error instanceof SSLCommerzConfigurationError) {
      console.error(
        "SSLCommerz IPN configuration failure.",
        sanitizedSSLCommerzErrorContext(error, {
          route: "sslcommerz-ipn",
        }),
      );
      return NextResponse.json(
        { error: "SSLCommerz payment verification is unavailable." },
        { status: 503 },
      );
    }

    if (error instanceof SSLCommerzProviderUnavailableError) {
      console.error(
        "SSLCommerz IPN provider failure.",
        sanitizedSSLCommerzErrorContext(error, {
          route: "sslcommerz-ipn",
          validationIdHash: validationId
            ? fingerprintSSLCommerzValue(validationId)
            : "missing",
        }),
      );
      return NextResponse.json(
        {
          error:
            "SSLCommerz payment verification is temporarily unavailable.",
        },
        { status: error.httpStatus },
      );
    }

    console.error(
      "SSLCommerz IPN database failure.",
      sanitizedSSLCommerzErrorContext(error, {
        route: "sslcommerz-ipn",
        validationIdHash: validationId
          ? fingerprintSSLCommerzValue(validationId)
          : "missing",
      }),
    );
    return NextResponse.json(
      { error: "SSLCommerz payment verification failed." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;
  const provider = rawProvider.toLowerCase();

  if (provider === "stripe") {
    return handleStripeWebhook(request);
  }
  if (provider === "sslcommerz") {
    return handleSSLCommerzWebhook(request);
  }

  return NextResponse.json(
    { error: "Unsupported payment webhook provider." },
    { status: 404 },
  );
}
