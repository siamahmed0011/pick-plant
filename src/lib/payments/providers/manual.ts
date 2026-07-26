import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import type {
  PaymentProviderAdapter,
  PaymentInitiateOptions,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";

export class ManualPaymentProvider implements PaymentProviderAdapter {
  provider = PaymentProvider.MANUAL;

  isEnabled(): boolean {
    return true;
  }

  async initiatePayment(options: PaymentInitiateOptions): Promise<PaymentInitiateResult> {
    return {
      success: true,
      isManual: true,
      transactionId: options.idempotencyKey || `MANUAL-${options.orderNumber}`,
      message: "Manual payment reference submitted for verification.",
    };
  }

  async verifyPayment(payload: Record<string, unknown>): Promise<PaymentVerificationResult> {
    const verified = Boolean(payload.verified);
    return {
      success: verified,
      status: verified ? TransactionStatus.VERIFIED : TransactionStatus.FAILED,
      providerReference: (payload.referenceNumber as string) || undefined,
      failureReason: verified ? undefined : (payload.reason as string) || "Manual payment rejected by admin.",
    };
  }
}

export const manualProvider = new ManualPaymentProvider();
