import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

/**
 * Valid state transitions for OrderStatus
 */
const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

/**
 * Valid state transitions for PaymentStatus
 */
const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.UNPAID]: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PENDING]: [PaymentStatus.UNPAID, PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.AUTHORIZED]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.REFUNDED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING, PaymentStatus.PAID],
  [PaymentStatus.REFUNDED]: [],
};

export function isValidOrderStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  return VALID_ORDER_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isValidPaymentStatusTransition(current: PaymentStatus, next: PaymentStatus): boolean {
  if (current === next) return true;
  return VALID_PAYMENT_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isCancellableByCustomer(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING || status === OrderStatus.CONFIRMED || status === OrderStatus.PROCESSING;
}

export function isCancellableByAdmin(status: OrderStatus): boolean {
  return status !== OrderStatus.CANCELLED && status !== OrderStatus.DELIVERED && status !== OrderStatus.REFUNDED && status !== OrderStatus.RETURNED;
}
