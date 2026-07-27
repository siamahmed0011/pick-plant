import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@/generated/prisma/enums";

export const PAYMENT_INITIATION_MIN_REMAINING_MS = 2 * 60 * 1000;

export type OnlinePaymentProvider =
  | typeof PaymentProvider.STRIPE
  | typeof PaymentProvider.SSLCOMMERZ;

const INITIABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];
const INITIABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.UNPAID,
  PaymentStatus.FAILED,
];

export function asOnlinePaymentProvider(
  provider: string | null | undefined,
): OnlinePaymentProvider | null {
  if (provider === PaymentProvider.STRIPE) return PaymentProvider.STRIPE;
  if (provider === PaymentProvider.SSLCOMMERZ) {
    return PaymentProvider.SSLCOMMERZ;
  }
  return null;
}

export function hasSafePaymentWindow(
  expiresAt: Date | string | null | undefined,
  checkedAt = new Date(),
) {
  if (!expiresAt) return false;
  const expiresAtMs =
    expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt);

  return (
    Number.isFinite(expiresAtMs) &&
    expiresAtMs > checkedAt.getTime() + PAYMENT_INITIATION_MIN_REMAINING_MS
  );
}

export function evaluatePaymentInitiationEligibility(
  order: {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentProvider: string | null;
    expiresAt: Date | string | null;
    reservationReleasedAt: Date | string | null;
  },
  checkedAt = new Date(),
):
  | { eligible: true; provider: OnlinePaymentProvider }
  | {
      eligible: false;
      reason:
        | "unsupported_provider"
        | "terminal_order"
        | "terminal_payment"
        | "released"
        | "expired_or_expiring";
    } {
  const provider = asOnlinePaymentProvider(order.paymentProvider);
  if (!provider) return { eligible: false, reason: "unsupported_provider" };
  if (!INITIABLE_ORDER_STATUSES.includes(order.status)) {
    return { eligible: false, reason: "terminal_order" };
  }
  if (!INITIABLE_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    return { eligible: false, reason: "terminal_payment" };
  }
  if (order.reservationReleasedAt !== null) {
    return { eligible: false, reason: "released" };
  }
  if (!hasSafePaymentWindow(order.expiresAt, checkedAt)) {
    return { eligible: false, reason: "expired_or_expiring" };
  }

  return { eligible: true, provider };
}
