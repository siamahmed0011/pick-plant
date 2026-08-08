import "server-only";

import { prisma } from "@/lib/prisma";

export const CUSTOMERS_PAGE_SIZE = 10;

export type CustomerFilterParams = {
  search?: string;
  role?: string;
  page?: number;
};

export type CustomerItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  emailVerified: Date | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  addressesCount: number;
};

export type CustomerDetail = CustomerItem & {
  addresses: Array<{
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    postalCode: string | null;
    isDefault: boolean;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    grandTotal: number;
    createdAt: Date;
  }>;
};

export async function getAdminCustomersList(params: CustomerFilterParams) {
  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();
  const roleFilter = params.role?.trim();

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (roleFilter && roleFilter !== "ALL") {
    where.role = roleFilter;
  }

  const [totalItems, users, totalCustomersCount, activeCustomersCount, adminUsersCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
      take: CUSTOMERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
        orders: {
          select: {
            grandTotal: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  const items: CustomerItem[] = users.map((user) => {
    const validOrders = user.orders.filter((o) => o.status !== "CANCELLED");
    const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const lastOrderDate = user.orders.length > 0 ? user.orders[0].createdAt : null;

    return {
      id: user.id,
      name: user.name ?? "Unnamed Customer",
      email: user.email ?? "No Email",
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      totalOrders: user._count.orders,
      totalSpent,
      lastOrderDate,
      addressesCount: user._count.addresses,
    };
  });

  const totalPages = Math.ceil(totalItems / CUSTOMERS_PAGE_SIZE) || 1;

  return {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    summary: {
      totalCustomers: totalCustomersCount,
      activeCustomers: activeCustomersCount,
      adminUsers: adminUsersCount,
    },
  };
}

export async function getAdminCustomerById(id: string): Promise<CustomerDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      emailVerified: true,
      _count: {
        select: { orders: true, addresses: true },
      },
      addresses: {
        orderBy: { isDefault: "desc" },
        select: {
          id: true,
          fullName: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          district: true,
          postalCode: true,
          isDefault: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  const validOrders = user.orders.filter((o) => o.status !== "CANCELLED");
  const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const lastOrderDate = user.orders.length > 0 ? user.orders[0].createdAt : null;

  return {
    id: user.id,
    name: user.name ?? "Unnamed Customer",
    email: user.email ?? "No Email",
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    totalOrders: user._count.orders,
    totalSpent,
    lastOrderDate,
    addressesCount: user._count.addresses,
    addresses: user.addresses,
    recentOrders: user.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      grandTotal: Number(o.grandTotal),
      createdAt: o.createdAt,
    })),
  };
}
