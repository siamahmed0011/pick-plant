import Stripe from "stripe";
import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import type {
  PaymentProviderAdapter,
  PaymentInitiateOptions,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";
import { verifiedPaymentRedirectUrl } from "@/lib/payments/payment-redirect-url";

const supportedSuccessfulEventTypes = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);
const supportedStripeCurrencies = new Set(["bdt"]);

export class StripeConfigurationError extends Error {}
export class StripeVerificationError extends Error {}

export function normalizeStripeCurrency(currency: string) {
  const normalized = currency.trim().toLowerCase();

  if (!supportedStripeCurrencies.has(normalized)) {
    throw new StripeVerificationError("Unsupported Stripe currency.");
  }

  return normalized;
}

export function toStripeMinorUnits(
  amount: Prisma.Decimal | number | string,
  currency: string,
) {
  normalizeStripeCurrency(currency);

  const decimal = new Prisma.Decimal(amount);

  if (!decimal.isFinite() || decimal.isNegative()) {
    throw new StripeVerificationError("Invalid Stripe payment amount.");
  }

  const minorUnits = decimal
    .mul(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

  const value = minorUnits.toNumber();

  if (!minorUnits.isInteger() || !Number.isSafeInteger(value)) {
    throw new StripeVerificationError("Stripe payment amount is outside the supported range.");
  }

  return value;
}

export function sanitizedStripeErrorContext(
  error: unknown,
  context: Record<string, string>,
) {
  if (error instanceof Stripe.errors.StripeError) {
    return {
      ...context,
      errorType: error.type,
      errorCode: error.code ?? "unknown",
      requestId: error.requestId ?? "unknown",
    };
  }

  return {
    ...context,
    errorType: error instanceof Error ? error.name : "UnknownError",
  };
}

export function isMissingStripeResource(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === "resource_missing"
  );
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new StripeConfigurationError("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey);
}

export function constructStripeWebhookEvent(rawBody: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new StripeConfigurationError("Stripe webhook secret is not configured.");
  }

  return getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export function isSupportedSuccessfulStripeEvent(
  event: Stripe.Event,
): event is Stripe.Event & { data: { object: Stripe.Checkout.Session } } {
  return supportedSuccessfulEventTypes.has(event.type);
}

export function stripeObjectId(value: string | { id: string } | null): string | null {
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

export function assertStripeSessionShape(session: Stripe.Checkout.Session) {
  const paymentIntentId = stripeObjectId(session.payment_intent);
  const metadataOrderId = session.metadata?.orderId;
  const metadataProvider = session.metadata?.paymentProvider;

  if (!session.id.startsWith("cs_")) {
    throw new StripeVerificationError("Invalid Stripe Checkout Session ID.");
  }
  if (session.mode !== "payment") {
    throw new StripeVerificationError("Stripe Checkout Session mode mismatch.");
  }
  if (!paymentIntentId?.startsWith("pi_")) {
    throw new StripeVerificationError("Stripe PaymentIntent is missing.");
  }
  if (!session.client_reference_id || session.client_reference_id !== metadataOrderId) {
    throw new StripeVerificationError("Stripe order reference mismatch.");
  }
  if (metadataProvider !== PaymentProvider.STRIPE) {
    throw new StripeVerificationError("Stripe payment provider metadata mismatch.");
  }
  if (session.payment_status !== "paid") {
    throw new StripeVerificationError("Stripe Checkout Session is not paid.");
  }
  if (session.amount_total === null || !session.currency) {
    throw new StripeVerificationError("Stripe amount or currency is missing.");
  }

  return {
    sessionId: session.id,
    paymentIntentId,
    orderId: metadataOrderId,
    amountTotal: session.amount_total,
    currency: normalizeStripeCurrency(session.currency),
  };
}

export async function retrieveStripePaymentIntent(paymentIntentId: string) {
  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
    throw new StripeVerificationError("Invalid Stripe PaymentIntent ID.");
  }

  return getStripeClient().paymentIntents.retrieve(paymentIntentId);
}

export function assertStripePaymentIntentShape(
  paymentIntent: Stripe.PaymentIntent,
  session: ReturnType<typeof assertStripeSessionShape>,
) {
  if (paymentIntent.id !== session.paymentIntentId) {
    throw new StripeVerificationError("Stripe PaymentIntent ID mismatch.");
  }
  if (paymentIntent.status !== "succeeded") {
    throw new StripeVerificationError("Stripe PaymentIntent is not successful.");
  }
  if (
    paymentIntent.metadata.orderId !== session.orderId ||
    paymentIntent.metadata.paymentProvider !== PaymentProvider.STRIPE
  ) {
    throw new StripeVerificationError("Stripe PaymentIntent metadata mismatch.");
  }
  if (
    paymentIntent.amount_received !== session.amountTotal ||
    normalizeStripeCurrency(paymentIntent.currency) !== session.currency
  ) {
    throw new StripeVerificationError("Stripe PaymentIntent amount or currency mismatch.");
  }

  return {
    amountReceived: paymentIntent.amount_received,
    currency: normalizeStripeCurrency(paymentIntent.currency),
  };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    throw new StripeVerificationError("Invalid Stripe Checkout Session ID.");
  }

  return getStripeClient().checkout.sessions.retrieve(sessionId);
}

export class StripeProvider implements PaymentProviderAdapter {
  provider = PaymentProvider.STRIPE;

  isEnabled(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  async initiatePayment(options: PaymentInitiateOptions): Promise<PaymentInitiateResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: "Stripe online payment is currently disabled. Gateway secret key missing.",
      };
    }
    if (!options.idempotencyKey) {
      return {
        success: false,
        error: "Stripe payment attempt is not initialized.",
      };
    }

    try {
      const stripe = getStripeClient();
      const currency = normalizeStripeCurrency(options.currency || "BDT");
      const returnUrl =
        options.returnUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/stripe/callback`;

      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          payment_method_types: ["card"],
          client_reference_id: options.orderId,
          customer_email: options.customerEmail,
          metadata: {
            orderId: options.orderId,
            orderNumber: options.orderNumber,
            paymentProvider: PaymentProvider.STRIPE,
          },
          payment_intent_data: {
            metadata: {
              orderId: options.orderId,
              orderNumber: options.orderNumber,
              paymentProvider: PaymentProvider.STRIPE,
            },
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount: toStripeMinorUnits(options.amount, currency),
                product_data: {
                  name: `Order #${options.orderNumber}`,
                },
              },
            },
          ],
          success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
        },
        {
          idempotencyKey: options.idempotencyKey,
        },
      );

      const redirectUrl = verifiedPaymentRedirectUrl(
        session.url,
        PaymentProvider.STRIPE,
      );
      if (!redirectUrl) {
        return {
          success: false,
          error: "Stripe did not return a Checkout URL.",
        };
      }

      return {
        success: true,
        redirectUrl,
        transactionId: session.id,
      };
    } catch (error) {
      console.error(
        "Stripe Checkout Session creation failed.",
        sanitizedStripeErrorContext(error, {
          orderId: options.orderId,
          orderNumber: options.orderNumber,
        }),
      );

      return {
        success: false,
        error: "Stripe Checkout Session could not be created.",
      };
    }
  }

  async verifyPayment(): Promise<PaymentVerificationResult> {
    return {
      success: false,
      status: TransactionStatus.FAILED,
      failureReason: "Stripe payments are verified only by signed webhooks.",
    };
  }
}

export const stripeProvider = new StripeProvider();
