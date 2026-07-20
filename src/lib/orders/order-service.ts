import "server-only";

import { prisma } from "@/lib/prisma";
import { ProductStatus, InventoryMovementType, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
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

export async function createOrder(input: CheckoutInput, userId?: string) {
  const validated = checkoutFormSchema.parse(input);

  return prisma.$transaction(
    async (tx) => {
      // 1. Fetch live products from DB
      const productIds = validated.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: {
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
      }

      // Calculate standard shipping & totals
      const shippingTotal = new Prisma.Decimal(60); // Flat shipping fee of BDT 60
      const discountTotal = new Prisma.Decimal(0);
      const taxTotal = new Prisma.Decimal(0);
      const grandTotal = subtotal.add(shippingTotal).add(taxTotal).sub(discountTotal);

      // Generate order number
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.order.findUnique({ where: { orderNumber } });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: validated.paymentMethod,
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
          placedAt: new Date(),
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Deduct product stock & Create InventoryMovement
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

      // Initial OrderStatusHistory
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

      return order;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function updateOrderStatus(
  input: { orderId: string; status: OrderStatus; note?: string | null },
  actor: OrderActor
) {
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

    // Handle cancellation stock restoration inside this transition if cancelling via admin
    if (input.status === OrderStatus.CANCELLED) {
      return cancelOrderInternal(tx, order, actor, input.note || "Order cancelled by admin");
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
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) throw new OrderNotFoundError("Order not found.");

    if (order.status === OrderStatus.CANCELLED) {
      return order; // Already cancelled
    }

    if (actor.role === "CUSTOMER") {
      if (order.userId !== actor.id) {
        throw new OrderValidationError("You do not have permission to cancel this order.");
      }
      if (!isCancellableByCustomer(order.status)) {
        throw new OrderValidationError("Order cannot be cancelled after it has been shipped.");
      }
    } else if (actor.role === "ADMIN") {
      if (!isCancellableByAdmin(order.status)) {
        throw new OrderValidationError(`Order in status ${order.status} cannot be cancelled.`);
      }
    }

    return cancelOrderInternal(tx, order, actor, input.reason || "Order cancelled");
  });
}

// Internal reusable helper for cancellation logic within a transaction
async function cancelOrderInternal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  actor: OrderActor,
  reason: string
) {
  // 1. Update Order status to CANCELLED
  const updatedOrder = await tx.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });

  // 2. Restore stock & create InventoryMovement for each item
  for (const item of order.items) {
    if (item.productId) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, sku: true, stockQuantity: true },
      });

      if (product) {
        const previousStock = product.stockQuantity;
        const newStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            product: { connect: { id: product.id } },
            performedBy: actor.id ? { connect: { id: actor.id } } : undefined,
            type: InventoryMovementType.RESTOCK,
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: "Order Cancellation",
            note: reason,
            reference: order.orderNumber,
            productName: item.productName || product.name,
            productSku: item.sku || product.sku,
            performedByEmail: actor.email,
            performedByName: actor.name,
          },
        });
      }
    }
  }

  // 3. Log OrderStatusHistory
  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: OrderStatus.CANCELLED,
      paymentStatus: order.paymentStatus,
      note: reason,
      performedById: actor.id,
      performedByName: actor.name,
      performedByRole: actor.role,
    },
  });

  return updatedOrder;
}

export async function updateAdminNotes(input: { orderId: string; adminNotes: string }) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new OrderNotFoundError("Order not found.");

  return prisma.order.update({
    where: { id: input.orderId },
    data: { adminNotes: input.adminNotes },
  });
}
