import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import type {
  PaymentProviderAdapter,
  PaymentInitiateOptions,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";

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

    // Server-side Stripe checkout session creation
    try {
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "payment_method_types[0]": "card",
          "line_items[0][price_data][currency]": (options.currency || "bdt").toLowerCase(),
          "line_items[0][price_data][product_data][name]": `Order #${options.orderNumber}`,
          "line_items[0][price_data][unit_amount]": Math.round(options.amount * 100).toString(),
          "line_items[0][quantity]": "1",
          mode: "payment",
          client_reference_id: options.orderId,
          customer_email: options.customerEmail,
          success_url: `${options.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`}?orderNumber=${options.orderNumber}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
        }).toString(),
      });

      const data = await res.json();
      if (data.url) {
        return {
          success: true,
          redirectUrl: data.url,
          transactionId: data.id,
        };
      }

      return {
        success: false,
        error: data.error?.message || "Failed to create Stripe payment session.",
      };
    } catch {
      return {
        success: false,
        error: "Network error during Stripe session creation.",
      };
    }
  }

  async verifyPayment(payload: Record<string, unknown>): Promise<PaymentVerificationResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        status: TransactionStatus.FAILED,
        failureReason: "Stripe credentials missing.",
      };
    }

    const paymentStatus = payload.payment_status as string;
    const paymentIntent = payload.payment_intent as string;

    if (paymentStatus === "paid") {
      return {
        success: true,
        status: TransactionStatus.SUCCESS,
        providerReference: paymentIntent || (payload.id as string),
        rawMetadataJson: JSON.stringify(payload),
      };
    }

    return {
      success: false,
      status: TransactionStatus.FAILED,
      failureReason: `Stripe payment status: ${paymentStatus}`,
      rawMetadataJson: JSON.stringify(payload),
    };
  }
}

export const stripeProvider = new StripeProvider();
