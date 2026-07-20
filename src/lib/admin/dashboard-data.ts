import "server-only";

import { USER_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export type AdminDashboardData = {
  available: boolean;
  counts: {
    products: number | null;
    orders: number | null;
    customers: number | null;
    reviews: number | null;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    status: string;
    total: number;
    date: Date;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  recentCustomers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date;
  }>;
};

const unavailableDashboardData: AdminDashboardData = {
  available: false,
  counts: {
    products: null,
    orders: null,
    customers: null,
    reviews: null,
  },
  recentOrders: [],
  lowStockProducts: [],
  recentCustomers: [],
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const [
      products,
      orders,
      customers,
      reviews,
      recentOrders,
      lowStockProducts,
      recentCustomers,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: USER_ROLES.CUSTOMER } }),
      prisma.review.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          status: true,
          grandTotal: true,
          placedAt: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          shippingAddress: { select: { recipientName: true } },
        },
      }),
      prisma.product.findMany({
        where: {
          trackInventory: true,
          status: { not: "ARCHIVED" },
          lowStockThreshold: { not: null },
          stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
        },
        orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
        take: 5,
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true,
        },
      }),
      prisma.user.findMany({
        where: { role: USER_ROLES.CUSTOMER },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      available: true,
      counts: { products, orders, customers, reviews },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer:
          order.customerName ??
          order.user?.name ??
          order.user?.email ??
          order.shippingAddress?.recipientName ??
          "Guest customer",
        status: order.status,
        total: Number(order.grandTotal),
        date: order.placedAt ?? order.createdAt,
      })),
      lowStockProducts: lowStockProducts.flatMap((product) =>
        product.lowStockThreshold === null
          ? []
          : [
              {
                ...product,
                lowStockThreshold: product.lowStockThreshold,
              },
            ],
      ),
      recentCustomers,
    };
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    console.error("Admin dashboard data could not be loaded.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: errorCode,
    });
    return unavailableDashboardData;
  }
}
