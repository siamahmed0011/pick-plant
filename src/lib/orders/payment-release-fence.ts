import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@/generated/prisma/enums";

const CONFIRMABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.UNPAID,
  PaymentStatus.FAILED,
  PaymentStatus.AUTHORIZED,
];
const TERMINAL_UNPAYABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
  OrderStatus.REFUNDED,
];

export class PaymentReservationUnavailableError extends Error {}

export function orderReservationIsUnavailable(
  order: {
    status: OrderStatus;
    expiresAt: Date | null;
    reservationReleasedAt: Date | null;
  },
  checkedAt = new Date(),
) {
  return (
    TERMINAL_UNPAYABLE_ORDER_STATUSES.includes(order.status) ||
    order.reservationReleasedAt !== null ||
    (order.expiresAt !== null && order.expiresAt <= checkedAt)
  );
}

export async function confirmOrderPaymentWithinReservation(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    provider: PaymentProvider;
    paymentReference: string;
    confirmedAt?: Date;
  },
) {
  const confirmedAt = input.confirmedAt ?? new Date();

  return tx.order.updateMany({
    where: {
      id: input.orderId,
      paymentProvider: input.provider,
      paymentStatus: { in: CONFIRMABLE_PAYMENT_STATUSES },
      status: {
        notIn: TERMINAL_UNPAYABLE_ORDER_STATUSES,
      },
      reservationReleasedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: confirmedAt } },
      ],
    },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentReference: input.paymentReference,
    },
  });
}
