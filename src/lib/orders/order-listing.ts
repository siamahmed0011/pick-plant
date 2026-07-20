import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export type AdminOrdersQueryFilters = {
  search?: string;
  status?: OrderStatus | "ALL";
  paymentStatus?: PaymentStatus | "ALL";
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "grandTotal";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function getAdminOrdersList(filters: AdminOrdersQueryFilters = {}) {
  const {
    search,
    status,
    paymentStatus,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 10,
  } = filters;

  const where: Prisma.OrderWhereInput = {};

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { orderNumber: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { customerEmail: { contains: term, mode: "insensitive" } },
      { customerPhone: { contains: term, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (paymentStatus && paymentStatus !== "ALL") {
    where.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const skip = (Math.max(1, page) - 1) * pageSize;

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            productImageUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      shippingTotal: Number(o.shippingTotal),
      discountTotal: Number(o.discountTotal),
      taxTotal: Number(o.taxTotal),
      grandTotal: Number(o.grandTotal),
      items: o.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function getAdminOrderDetails(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shippingTotal),
    discountTotal: Number(order.discountTotal),
    taxTotal: Number(order.taxTotal),
    grandTotal: Number(order.grandTotal),
    items: order.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
    })),
  };
}

export async function getCustomerOrdersList(userId: string, page = 1, pageSize = 10) {
  const skip = (Math.max(1, page) - 1) * pageSize;
  const where: Prisma.OrderWhereInput = { userId };

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        items: true,
      },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      shippingTotal: Number(o.shippingTotal),
      discountTotal: Number(o.discountTotal),
      taxTotal: Number(o.taxTotal),
      grandTotal: Number(o.grandTotal),
      items: o.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function getCustomerOrderDetails(userId: string, orderIdOrNumber: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    orderIdOrNumber
  );

  const order = await prisma.order.findFirst({
    where: {
      userId,
      ...(isUuid ? { id: orderIdOrNumber } : { orderNumber: orderIdOrNumber }),
    },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shippingTotal),
    discountTotal: Number(order.discountTotal),
    taxTotal: Number(order.taxTotal),
    grandTotal: Number(order.grandTotal),
    items: order.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
    })),
  };
}
