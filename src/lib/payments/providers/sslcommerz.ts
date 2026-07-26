import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import type {
  PaymentProviderAdapter,
  PaymentInitiateOptions,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";

export class SSLCommerzProvider implements PaymentProviderAdapter {
  provider = PaymentProvider.SSLCOMMERZ;

  isEnabled(): boolean {
    return Boolean(
      process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD
    );
  }

  async initiatePayment(options: PaymentInitiateOptions): Promise<PaymentInitiateResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: "SSLCommerz online payment is currently disabled. Gateway credentials missing.",
      };
    }

    // In a production environment with credentials set, call SSLCommerz API
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
    const sslUrl = isSandbox
      ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
      : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

    try {
      const formData = new URLSearchParams({
        store_id: storeId!,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD!,
        total_amount: options.amount.toString(),
        currency: options.currency || "BDT",
        tran_id: options.orderNumber,
        success_url: options.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/callback`,
        fail_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/callback`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/callback`,
        cus_name: options.customerName,
        cus_email: options.customerEmail,
        cus_phone: options.customerPhone,
        shipping_method: "NO",
        product_name: `Order #${options.orderNumber}`,
        product_category: "Plants",
        product_profile: "physical-goods",
      });

      const res = await fetch(sslUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await res.json();
      if (data.status === "SUCCESS" && data.GatewayPageURL) {
        return {
          success: true,
          redirectUrl: data.GatewayPageURL,
          transactionId: options.orderNumber,
        };
      }

      return {
        success: false,
        error: data.failedreason || "Failed to initiate SSLCommerz payment session.",
      };
    } catch {
      return {
        success: false,
        error: "Network error during SSLCommerz initiation.",
      };
    }
  }

  async verifyPayment(payload: Record<string, unknown>): Promise<PaymentVerificationResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        status: TransactionStatus.FAILED,
        failureReason: "SSLCommerz credentials missing.",
      };
    }

    const status = payload.status as string;
    const valId = payload.val_id as string;

    if (status === "VALID" || status === "VALIDATED") {
      return {
        success: true,
        status: TransactionStatus.SUCCESS,
        providerReference: valId || (payload.bank_tran_id as string),
        amount: payload.amount ? Number(payload.amount) : undefined,
        rawMetadataJson: JSON.stringify(payload),
      };
    }

    return {
      success: false,
      status: TransactionStatus.FAILED,
      failureReason: (payload.error as string) || `Payment status: ${status}`,
      rawMetadataJson: JSON.stringify(payload),
    };
  }
}

export const sslCommerzProvider = new SSLCommerzProvider();
