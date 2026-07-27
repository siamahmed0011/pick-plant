import "server-only";

import { prisma } from "@/lib/prisma";
import { CartStatus, ProductStatus, InventoryMovementType, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { generateOrderNumber } from "@/lib/orders/order-number";
import { checkoutFormSchema, type CheckoutInput } from "@/lib/orders/order-validation";
import {
  isValidOrderStatusTransition,
  isValidPaymentStatusTransition,
  isCancellableByCustomer,
  isCancellableByAdmin,
} from "@/lib/orders/order-transitions";
import { Prisma } from "@/generated/prisma/client";

export class OrderError extends Error {}
export class OrderNotFoundError extends OrderError {}
export class OrderStockError extends OrderError {}
export class OrderValidationError extends OrderError {}

export type OrderActor = {
  id: string;
  name: string | null;
  email: string | null;
  role: "CUSTOMER" | "ADMIN";
};

import { validateAndCalculateCoupon, redeemCouponInTransaction } from "@/lib/coupons/coupon-service";
import { calculateShippingCost } from "@/lib/shipping/shipping-service";
import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import { createSSLCommerzMerchantTransactionReference } from "@/lib/payments/providers/sslcommerz";

const ONLINE_ORDER_EXPIRATION_MS = 30 * 60 * 1000;
const EXPIRATION_RETRY_DELAY_MS = 5 * 60 * 1000;
const RELEASABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.UNPAID,
  PaymentStatus.FAILED,
];

type ReservationReleaseRequest =
  | {
      cause: "CANCELLATION";
      actor: OrderActor;
      reason: string;
    }
  | {
      cause: "EXPIRATION";
      now?: Date;
    };

function onlineOrderExpiresAt(provider: PaymentProvider) {
  if (
    provider !== PaymentProvider.STRIPE &&
    provider !== PaymentProvider.SSLCOMMERZ
  ) {
    return null;
  }

  return new Date(Date.now() + ONLINE_ORDER_EXPIRATION_MS);
}

export async function createOrder(
  input: CheckoutInput,
  userId: string | undefined,
  sourceCartId: string,
) {
  const validated = checkoutFormSchema.parse(input);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const sourceCart = await tx.cart.findUnique({
          where: { id: sourceCartId },
          select: {
            userId: true,
            status: true,
            expiresAt: true,
          },
        });
        if (
          !sourceCart ||
          sourceCart.userId !== (userId ?? null) ||
          !sourceCart.expiresAt ||
          sourceCart.expiresAt <= new Date()
        ) {
          throw new OrderValidationError(
            "Checkout session expired. Please submit your order again.",
          );
        }

        const replayedOrder = await tx.order.findUnique({
          where: { sourceCartId },
          include: { items: true },
        });
        if (replayedOrder) return replayedOrder;
        if (sourceCart.status !== CartStatus.ACTIVE) {
          throw new OrderValidationError(
            "Checkout session is no longer available.",
          );
        }

      // 1. Fetch live products from DB
      const productIds = validated.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: {
          category: { select: { id: true, name: true } },
          images: {
            orderBy: { position: "asc" },
            take: 1,
          },
        },
      });

      if (products.length !== validated.items.length) {
        throw new OrderValidationError("One or more items in your cart are no longer available.");
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2. Validate stock and recalculate subtotal
      let subtotal = new Prisma.Decimal(0);
      const orderItemsData: Array<{
        productId: string;
        sku: string;
        productName: string;
        productImageUrl: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }> = [];

      const stockUpdates: Array<{
        productId: string;
        productName: string;
        productSku: string;
        quantityDeducted: number;
        previousStock: number;
        newStock: number;
      }> = [];

      const cartItemsForCoupon: Array<{
        productId: string;
        categoryId?: string;
        price: number;
        quantity: number;
      }> = [];

      for (const item of validated.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new OrderValidationError(`Product not found.`);
        }
        if (product.status !== ProductStatus.ACTIVE) {
          throw new OrderValidationError(`"${product.name}" is not available for purchase.`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new OrderStockError(
            `Insufficient stock for "${product.name}". Only ${product.stockQuantity} remaining.`
          );
        }

        const price = new Prisma.Decimal(product.price);
        const lineTotal = price.mul(item.quantity);
        subtotal = subtotal.add(lineTotal);

        const primaryImage = product.images[0]?.url || product.images[0]?.secureUrl || null;

        orderItemsData.push({
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          productImageUrl: primaryImage,
          quantity: item.quantity,
          unitPrice: price,
          lineTotal,
        });

        stockUpdates.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantityDeducted: item.quantity,
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity - item.quantity,
        });

        cartItemsForCoupon.push({
          productId: product.id,
          categoryId: product.categoryId,
          price: Number(price),
          quantity: item.quantity,
        });
      }

      // 3. Calculate dynamic shipping cost from shipping zone
      const shippingCalc = await calculateShippingCost(
        validated.shippingDistrict || "Dhaka",
        Number(subtotal)
      );
      const shippingTotal = new Prisma.Decimal(shippingCalc.shippingCost);

      // 4. Validate & calculate coupon discount if provided
      let appliedCouponId: string | null = null;
      let couponCode: string | null = null;
      let couponDiscountTotal = new Prisma.Decimal(0);

      if (validated.couponCode && validated.couponCode.trim()) {
        const couponResult = await validateAndCalculateCoupon(
          validated.couponCode,
          Number(subtotal),
          shippingCalc.shippingCost,
          cartItemsForCoupon,
          userId,
          validated.customerEmail
        );

        appliedCouponId = couponResult.couponId;
        couponCode = couponResult.code;
        couponDiscountTotal = new Prisma.Decimal(couponResult.discountAmount);
      }

      const discountTotal = couponDiscountTotal;
      const taxTotal = new Prisma.Decimal(0);
      const grandTotal = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        subtotal.add(shippingTotal).add(taxTotal).sub(discountTotal)
      );

      // 5. Generate order number
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.order.findUnique({ where: { orderNumber } });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      // Determine payment provider enum
      let provider: PaymentProvider = PaymentProvider.CASH_ON_DELIVERY;
      const pmUpper = (validated.paymentMethod || "").toUpperCase();
      if (pmUpper.includes("MANUAL") || pmUpper.includes("BKASH") || pmUpper.includes("NAGAD") || pmUpper.includes("BANK")) {
        provider = PaymentProvider.MANUAL;
      } else if (pmUpper.includes("SSLCOMMERZ")) {
        provider = PaymentProvider.SSLCOMMERZ;
      } else if (pmUpper.includes("STRIPE")) {
        provider = PaymentProvider.STRIPE;
      }
      const expiresAt = onlineOrderExpiresAt(provider);

      // 6. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          sourceCartId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentProvider: provider,
          paymentMethod: validated.manualPaymentChannel || validated.paymentMethod,
          paymentReference: validated.manualTransactionRef || null,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          shippingAddressLine1: validated.shippingAddressLine1,
          shippingAddressLine2: validated.shippingAddressLine2 || null,
          shippingCity: validated.shippingCity,
          shippingDistrict: validated.shippingDistrict,
          shippingArea: validated.shippingArea || null,
          shippingPostalCode: validated.shippingPostalCode || null,
          customerNote: validated.customerNote || null,
          subtotal,
          shippingTotal,
          discountTotal,
          taxTotal,
          grandTotal,
          couponCode,
          couponDiscountTotal,
          appliedCouponId,
          shippingZoneName: shippingCalc.zoneName,
          shippingMethodName: shippingCalc.rateName,
          shippingCost: shippingTotal,
          estimatedDeliveryText: shippingCalc.estimatedDeliveryText,
          placedAt: new Date(),
          expiresAt,
          expirationRetryAt: expiresAt,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 7. Record coupon redemption inside transaction if coupon applied
      if (appliedCouponId && couponCode) {
        await redeemCouponInTransaction(
          tx,
          appliedCouponId,
          order.id,
          userId,
          validated.customerEmail,
          Number(couponDiscountTotal)
        );
      }

      // 8. Create PaymentTransaction record
      const initialTxStatus =
        provider === PaymentProvider.CASH_ON_DELIVERY || provider === PaymentProvider.MANUAL
          ? TransactionStatus.PENDING
          : TransactionStatus.INITIATED;

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider,
          method: validated.manualPaymentChannel || validated.paymentMethod,
          status: initialTxStatus,
          amount: grandTotal,
          currency: "BDT",
          transactionId:
            provider === PaymentProvider.SSLCOMMERZ
              ? createSSLCommerzMerchantTransactionReference()
              : validated.manualTransactionRef ||
                `${provider}-${order.orderNumber}`,
          providerReference:
            provider === PaymentProvider.SSLCOMMERZ
              ? null
              : validated.manualTransactionRef || null,
        },
      });

      // 9. Deduct product stock & Create InventoryMovement
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: { stockQuantity: update.newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            product: { connect: { id: update.productId } },
            performedBy: userId ? { connect: { id: userId } } : undefined,
            type: InventoryMovementType.SALE,
            quantity: -update.quantityDeducted,
            previousStock: update.previousStock,
            newStock: update.newStock,
            reason: "Order Placement",
            note: `Order #${order.orderNumber}`,
            reference: order.orderNumber,
            productName: update.productName,
            productSku: update.productSku,
            performedByEmail: validated.customerEmail,
            performedByName: validated.customerName,
          },
        });
      }

      // 10. Initial OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          note: "Order placed successfully",
          performedById: userId || null,
          performedByName: validated.customerName,
          performedByRole: userId ? "CUSTOMER" : "GUEST",
        },
      });

      await tx.cart.update({
        where: { id: sourceCartId },
        data: { status: CartStatus.CONVERTED },
      });

      return order;
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      const replayedOrder = await prisma.order.findUnique({
        where: { sourceCartId },
        include: { items: true },
      });
      if (replayedOrder) return replayedOrder;
    }
    throw error;
  }
}

export async function updateOrderStatus(
  input: { orderId: string; status: OrderStatus; note?: string | null },
  actor: OrderActor
) {
  if (input.status === OrderStatus.CANCELLED) {
    return cancelOrder(
      {
        orderId: input.orderId,
        reason: input.note || "Order cancelled by admin",
      },
      actor,
    );
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) throw new OrderNotFoundError("Order not found.");

    if (order.status === input.status) {
      return order;
    }

    if (!isValidOrderStatusTransition(order.status, input.status)) {
      throw new OrderValidationError(
        `Cannot change order status from ${order.status} to ${input.status}.`
      );
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: input.status,
        paymentStatus: order.paymentStatus,
        note: input.note || `Order status updated to ${input.status}`,
        performedById: actor.id,
        performedByName: actor.name,
        performedByRole: actor.role,
      },
    });

    return updated;
  });
}

export async function updatePaymentStatus(
  input: { orderId: string; paymentStatus: PaymentStatus; note?: string | null },
  actor: OrderActor
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) throw new OrderNotFoundError("Order not found.");

    if (order.paymentStatus === input.paymentStatus) {
      return order;
    }

    if (!isValidPaymentStatusTransition(order.paymentStatus, input.paymentStatus)) {
      throw new OrderValidationError(
        `Cannot change payment status from ${order.paymentStatus} to ${input.paymentStatus}.`
      );
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: input.paymentStatus,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        paymentStatus: input.paymentStatus,
        note: input.note || `Payment status updated to ${input.paymentStatus}`,
        performedById: actor.id,
        performedByName: actor.name,
        performedByRole: actor.role,
      },
    });

    return updated;
  });
}

export async function cancelOrder(
  input: { orderId: string; reason?: string },
  actor: OrderActor
) {
  const result = await releaseReservation(input.orderId, {
    cause: "CANCELLATION",
    actor,
    reason: input.reason || "Order cancelled",
  });

  return result.order;
}

export async function releaseReservation(
  orderId: string,
  request: ReservationReleaseRequest,
  remainingRetries = 2,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const now = request.cause === "EXPIRATION" ? request.now ?? new Date() : new Date();
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          couponRedemption: {
            select: { couponId: true },
          },
        },
      });

      if (!order) throw new OrderNotFoundError("Order not found.");

      if (request.cause === "CANCELLATION") {
        const { actor } = request;

        if (actor.role === "CUSTOMER") {
          if (order.userId !== actor.id) {
            throw new OrderValidationError("You do not have permission to cancel this order.");
          }
          if (
            order.status === OrderStatus.CANCELLED &&
            order.reservationReleasedAt
          ) {
            return { order, released: false };
          }
          if (!isCancellableByCustomer(order.status)) {
            throw new OrderValidationError("Order cannot be cancelled after it has been shipped.");
          }
        } else if (!isCancellableByAdmin(order.status)) {
          if (
            order.status === OrderStatus.CANCELLED &&
            order.reservationReleasedAt
          ) {
            return { order, released: false };
          }
          throw new OrderValidationError(
            `Order in status ${order.status} cannot be cancelled.`,
          );
        }
      } else if (
        order.status !== OrderStatus.PENDING ||
        (order.paymentProvider !== PaymentProvider.STRIPE &&
          order.paymentProvider !== PaymentProvider.SSLCOMMERZ) ||
        !order.expiresAt ||
        order.expiresAt > now
      ) {
        return { order, released: false };
      }

      if (order.reservationReleasedAt) {
        return { order, released: false };
      }

      if (!RELEASABLE_PAYMENT_STATUSES.includes(order.paymentStatus)) {
        if (request.cause === "EXPIRATION") {
          return { order, released: false };
        }
        throw new OrderValidationError(
          "A paid, authorized, or refunded order cannot release its reservation.",
        );
      }

      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          reservationReleasedAt: null,
          paymentStatus: { in: RELEASABLE_PAYMENT_STATUSES },
          ...(request.cause === "EXPIRATION"
            ? {
                status: OrderStatus.PENDING,
                paymentProvider: {
                  in: [
                    PaymentProvider.STRIPE,
                    PaymentProvider.SSLCOMMERZ,
                  ],
                },
                expiresAt: { not: null, lte: now },
              }
            : {}),
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: now,
          reservationReleasedAt: now,
        },
      });

      if (claimed.count !== 1) {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current) throw new OrderNotFoundError("Order not found.");
        return { order: current, released: false };
      }

      for (const item of order.items) {
        if (!item.productId) continue;

        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
          },
        });
        const previousStock = product.stockQuantity - item.quantity;

        await tx.inventoryMovement.create({
          data: {
            product: { connect: { id: product.id } },
            performedBy:
              request.cause === "CANCELLATION" && request.actor.id
                ? { connect: { id: request.actor.id } }
                : undefined,
            type: InventoryMovementType.RESTOCK,
            quantity: item.quantity,
            previousStock,
            newStock: product.stockQuantity,
            reason:
              request.cause === "EXPIRATION"
                ? "Order Reservation Expired"
                : "Order Cancellation",
            note:
              request.cause === "EXPIRATION"
                ? "Unpaid order reservation expired automatically."
                : request.reason,
            reference: order.orderNumber,
            productName: item.productName || product.name,
            productSku: item.sku || product.sku,
            performedByEmail:
              request.cause === "CANCELLATION" ? request.actor.email : null,
            performedByName:
              request.cause === "CANCELLATION" ? request.actor.name : "System",
          },
        });
      }

      if (order.couponRedemption) {
        const releasedRedemption = await tx.couponRedemption.deleteMany({
          where: {
            orderId: order.id,
            couponId: order.couponRedemption.couponId,
          },
        });

        if (releasedRedemption.count === 1) {
          await tx.coupon.updateMany({
            where: {
              id: order.couponRedemption.couponId,
              usedCount: { gt: 0 },
            },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.CANCELLED,
          paymentStatus: order.paymentStatus,
          note:
            request.cause === "EXPIRATION"
              ? "Unpaid order reservation expired automatically."
              : request.reason,
          performedById:
            request.cause === "CANCELLATION" ? request.actor.id : null,
          performedByName:
            request.cause === "CANCELLATION" ? request.actor.name : "System",
          performedByRole:
            request.cause === "CANCELLATION" ? request.actor.role : "SYSTEM",
        },
      });

      const updatedOrder = await tx.order.findUnique({
        where: { id: order.id },
      });
      if (!updatedOrder) throw new OrderNotFoundError("Order not found.");

      return { order: updatedOrder, released: true };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (
      remainingRetries > 0 &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return releaseReservation(orderId, request, remainingRetries - 1);
    }

    throw error;
  }
}

export async function expireStaleUnpaidOrders(limit = 100) {
  const batchSize = Math.max(1, Math.min(limit, 500));
  const now = new Date();
  const candidates = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paymentProvider: {
        in: [PaymentProvider.STRIPE, PaymentProvider.SSLCOMMERZ],
      },
      paymentStatus: { in: RELEASABLE_PAYMENT_STATUSES },
      expiresAt: { not: null, lte: now },
      expirationRetryAt: { not: null, lte: now },
      reservationReleasedAt: null,
    },
    orderBy: [
      { expirationRetryAt: "asc" },
      { expiresAt: "asc" },
      { id: "asc" },
    ],
    select: { id: true },
    take: batchSize,
  });

  let expired = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates) {
    try {
      const result = await releaseReservation(candidate.id, {
        cause: "EXPIRATION",
        now,
      });
      if (result.released) expired += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      const retryAt = new Date(now.getTime() + EXPIRATION_RETRY_DELAY_MS);

      try {
        await prisma.order.updateMany({
          where: {
            id: candidate.id,
            status: OrderStatus.PENDING,
            paymentProvider: {
              in: [PaymentProvider.STRIPE, PaymentProvider.SSLCOMMERZ],
            },
            paymentStatus: { in: RELEASABLE_PAYMENT_STATUSES },
            reservationReleasedAt: null,
            expiresAt: { not: null, lte: now },
          },
          data: { expirationRetryAt: retryAt },
        });
      } catch {
        // The endpoint returns a retryable failure and the next run can retry.
      }

      console.error("Order reservation expiration failed.", {
        orderId: candidate.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorCode:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : undefined,
      });
    }
  }

  return {
    scanned: candidates.length,
    expired,
    skipped,
    failed,
  };
}

export async function updateAdminNotes(input: { orderId: string; adminNotes: string }) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new OrderNotFoundError("Order not found.");

  return prisma.order.update({
    where: { id: input.orderId },
    data: { adminNotes: input.adminNotes },
  });
}
