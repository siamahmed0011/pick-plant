import "server-only";

import { prisma } from "@/lib/prisma";
import { PaymentProvider, TransactionStatus, PaymentStatus } from "@/generated/prisma/enums";
import type { PaymentProviderAdapter } from "@/lib/payments/payment-provider";
import { codProvider } from "@/lib/payments/providers/cod";
import { manualProvider } from "@/lib/payments/providers/manual";
import { sslCommerzProvider } from "@/lib/payments/providers/sslcommerz";
import { stripeProvider } from "@/lib/payments/providers/stripe";
import type { Prisma } from "@/generated/prisma/client";

export class PaymentError extends Error {}

const adapters: Record<PaymentProvider, PaymentProviderAdapter> = {
  [PaymentProvider.CASH_ON_DELIVERY]: codProvider,
  [PaymentProvider.MANUAL]: manualProvider,
  [PaymentProvider.SSLCOMMERZ]: sslCommerzProvider,
  [PaymentProvider.STRIPE]: stripeProvider,
};

export function getPaymentAdapter(provider: PaymentProvider): PaymentProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new PaymentError(`Unsupported payment provider: ${provider}`);
  }
  return adapter;
}

export function getAvailablePaymentMethods(): Array<{
  provider: PaymentProvider;
  name: string;
  description: string;
  enabled: boolean;
}> {
  return [
    {
      provider: PaymentProvider.CASH_ON_DELIVERY,
      name: "Cash on Delivery (COD)",
      description: "Pay with cash when your plants arrive at your doorstep.",
      enabled: codProvider.isEnabled(),
    },
    {
      provider: PaymentProvider.MANUAL,
      name: "Mobile / Bank Transfer (bKash/Nagad/Bank)",
      description: "Send payment via bKash, Nagad, Rocket, or Bank Transfer and submit reference.",
      enabled: manualProvider.isEnabled(),
    },
    {
      provider: PaymentProvider.SSLCOMMERZ,
      name: "Online Card / Mobile Banking (SSLCommerz)",
      description: "Pay securely online via SSLCommerz gateway.",
      enabled: sslCommerzProvider.isEnabled(),
    },
    {
      provider: PaymentProvider.STRIPE,
      name: "Credit / Debit Card (Stripe)",
      description: "Pay securely online via Visa / Mastercard.",
      enabled: stripeProvider.isEnabled(),
    },
  ];
}

export async function createPaymentTransaction(
  tx: Prisma.TransactionClient,
  data: {
    orderId: string;
    provider: PaymentProvider;
    method?: string;
    amount: number;
    currency?: string;
    transactionId?: string;
    providerReference?: string;
    idempotencyKey?: string;
    status?: TransactionStatus;
    rawMetadataJson?: string;
  }
) {
  return tx.paymentTransaction.create({
    data: {
      orderId: data.orderId,
      provider: data.provider,
      method: data.method || data.provider,
      status: data.status || TransactionStatus.INITIATED,
      amount: new Decimal(data.amount),
      currency: data.currency || "BDT",
      transactionId: data.transactionId || null,
      providerReference: data.providerReference || null,
      idempotencyKey: data.idempotencyKey || null,
      rawMetadataJson: data.rawMetadataJson || null,
    },
  });
}

import { Prisma as PrismaClient } from "@/generated/prisma/client";
const Decimal = PrismaClient.Decimal;

export async function verifyManualPayment(
  transactionId: string,
  actor: { id: string; name: string | null; role: string }
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { order: true },
    });

    if (!transaction) throw new PaymentError("Payment transaction not found.");

    if (transaction.status === TransactionStatus.VERIFIED) {
      return transaction; // Already verified
    }

    const updatedTx = await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: transaction.orderId,
        status: transaction.order.status,
        paymentStatus: PaymentStatus.PAID,
        note: `Manual payment verified by ${actor.name || "Admin"} (Ref: ${
          transaction.providerReference || "N/A"
        })`,
        performedById: actor.id,
        performedByName: actor.name,
        performedByRole: actor.role,
      },
    });

    return updatedTx;
  });
}

export async function rejectManualPayment(
  transactionId: string,
  reason: string,
  actor: { id: string; name: string | null; role: string }
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { order: true },
    });

    if (!transaction) throw new PaymentError("Payment transaction not found.");

    const updatedTx = await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.FAILED,
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    await tx.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: transaction.orderId,
        status: transaction.order.status,
        paymentStatus: PaymentStatus.FAILED,
        note: `Manual payment rejected: ${reason}`,
        performedById: actor.id,
        performedByName: actor.name,
        performedByRole: actor.role,
      },
    });

    return updatedTx;
  });
}

export async function markCodAsPaid(
  orderId: string,
  actor: { id: string; name: string | null; role: string }
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { paymentTransactions: true },
    });

    if (!order) throw new PaymentError("Order not found.");

    if (order.paymentStatus === PaymentStatus.PAID) {
      return order;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });

    const codTx = order.paymentTransactions.find(
      (t) => t.provider === PaymentProvider.CASH_ON_DELIVERY
    );

    if (codTx) {
      await tx.paymentTransaction.update({
        where: { id: codTx.id },
        data: {
          status: TransactionStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });
    } else {
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.CASH_ON_DELIVERY,
          method: "Cash on Delivery",
          status: TransactionStatus.VERIFIED,
          amount: order.grandTotal,
          currency: order.currency,
          verifiedAt: new Date(),
        },
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        paymentStatus: PaymentStatus.PAID,
        note: `Cash on Delivery payment collected and marked as PAID by ${actor.name || "Admin"}`,
        performedById: actor.id,
        performedByName: actor.name,
        performedByRole: actor.role,
      },
    });

    return order;
  });
}

export async function refundPayment(
  orderId: string,
  note: string,
  actor: { id: string; name: string | null; role: string }
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { paymentTransactions: true },
    });

    if (!order) throw new PaymentError("Order not found.");

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
      },
    });

    for (const t of order.paymentTransactions) {
      if (t.status === TransactionStatus.VERIFIED || t.status === TransactionStatus.SUCCESS) {
        await tx.paymentTransaction.update({
          where: { id: t.id },
          data: {
            status: TransactionStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });
      }
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        paymentStatus: PaymentStatus.REFUNDED,
        note: `Payment marked as REFUNDED: ${note}`,
        performedById: actor.id,
        performedByName: actor.name,
        performedByRole: actor.role,
      },
    });

    return order;
  });
}
