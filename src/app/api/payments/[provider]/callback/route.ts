import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentProvider } from "@/generated/prisma/enums";
import {
  assertStripePaymentIntentShape,
  assertStripeSessionShape,
  normalizeStripeCurrency,
  retrieveStripeCheckoutSession,
  retrieveStripePaymentIntent,
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

function callbackUrl(request: Request, path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return new URL(path, baseUrl);
}

function callbackErrorResponse(
  error: unknown,
  validationId: string | null,
) {
  if (error instanceof SSLCommerzProofError) {
    return NextResponse.json(
      { error: "SSLCommerz payment proof is invalid." },
      { status: 400 },
    );
  }

  if (error instanceof SSLCommerzConfigurationError) {
    console.error(
      "SSLCommerz callback configuration failure.",
      sanitizedSSLCommerzErrorContext(error, {
        route: "sslcommerz-callback",
      }),
    );
    return NextResponse.json(
      { error: "SSLCommerz payment verification is unavailable." },
      { status: 503 },
    );
  }

  if (error instanceof SSLCommerzProviderUnavailableError) {
    console.error(
      "SSLCommerz callback provider failure.",
      sanitizedSSLCommerzErrorContext(error, {
        route: "sslcommerz-callback",
        validationIdHash: validationId
          ? fingerprintSSLCommerzValue(validationId)
          : "missing",
      }),
    );
    return NextResponse.json(
      { error: "SSLCommerz payment verification is temporarily unavailable." },
      { status: error.httpStatus },
    );
  }

  console.error(
    "SSLCommerz callback database failure.",
    sanitizedSSLCommerzErrorContext(error, {
      route: "sslcommerz-callback",
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

async function handleSSLCommerzCallback(request: Request) {
  let validationId: string | null = null;

  try {
    const payload = await readSSLCommerzRequestPayload(request);
    validationId =
      typeof payload.val_id === "string" && payload.val_id.trim()
        ? payload.val_id.trim()
        : null;

    if (isSubmittedSSLCommerzFailure(payload)) {
      return NextResponse.redirect(
        callbackUrl(request, "/checkout?error=payment_failed"),
      );
    }

    const result = await reconcileSSLCommerzPayment(payload, "callback");

    if (result.paymentConfirmed) {
      const successUrl = callbackUrl(request, "/checkout/success");
      successUrl.searchParams.set("orderNumber", result.orderNumber);
      return NextResponse.redirect(successUrl);
    }

    return NextResponse.redirect(
      callbackUrl(request, "/checkout?error=payment_pending_review"),
    );
  } catch (error) {
    return callbackErrorResponse(error, validationId);
  }
}

async function routeCallback(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;
  const provider = rawProvider.toLowerCase();

  if (provider === "stripe") {
    return handleStripeCallback(request);
  }
  if (provider === "sslcommerz") {
    return handleSSLCommerzCallback(request);
  }

  return NextResponse.json(
    { error: "Unsupported payment callback provider." },
    { status: 404 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  return routeCallback(request, context);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  return routeCallback(request, context);
}
