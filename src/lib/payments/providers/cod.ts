import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import type {
  PaymentProviderAdapter,
  PaymentInitiateOptions,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";

export class CashOnDeliveryProvider implements PaymentProviderAdapter {
  provider = PaymentProvider.CASH_ON_DELIVERY;

  isEnabled(): boolean {
    return true;
  }

  async initiatePayment(options: PaymentInitiateOptions): Promise<PaymentInitiateResult> {
    return {
      success: true,
      isCod: true,
      transactionId: `COD-${options.orderNumber}`,
      message: "Order placed via Cash on Delivery.",
    };
  }

  async verifyPayment(): Promise<PaymentVerificationResult> {
    return {
      success: true,
      status: TransactionStatus.PENDING,
    };
  }
}

export const codProvider = new CashOnDeliveryProvider();
