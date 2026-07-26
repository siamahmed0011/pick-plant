import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";

export type PaymentInitiateOptions = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl?: string;
  idempotencyKey?: string;
};

export type PaymentInitiateResult = {
  success: boolean;
  redirectUrl?: string;
  transactionId?: string;
  isManual?: boolean;
  isCod?: boolean;
  message?: string;
  error?: string;
};

export type PaymentVerificationResult = {
  success: boolean;
  status: TransactionStatus;
  transactionId?: string;
  providerReference?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
  rawMetadataJson?: string;
};

export interface PaymentProviderAdapter {
  provider: PaymentProvider;
  isEnabled(): boolean;
  initiatePayment(options: PaymentInitiateOptions): Promise<PaymentInitiateResult>;
  verifyPayment(payload: Record<string, unknown>): Promise<PaymentVerificationResult>;
}
