import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type AdminCouponsQueryFilters = {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

export async function getAdminCouponsList(filters: AdminCouponsQueryFilters = {}) {
  const { search, isActive, page = 1, pageSize = 10 } = filters;

  const where: Prisma.CouponWhereInput = {};

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { code: { contains: term, mode: "insensitive" } },
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const skip = (Math.max(1, page) - 1) * pageSize;

  const [totalCount, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    }),
  ]);

  return {
    coupons: coupons.map((c) => ({
      ...c,
      value: Number(c.value),
      minimumOrderAmount: c.minimumOrderAmount ? Number(c.minimumOrderAmount) : null,
      maximumDiscountAmount: c.maximumDiscountAmount ? Number(c.maximumDiscountAmount) : null,
      redemptionsCount: c._count.redemptions,
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function getCouponDetails(id: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      targetProducts: {
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
      targetCategories: {
        include: { category: { select: { id: true, name: true } } },
      },
      redemptions: {
        orderBy: { redeemedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!coupon) return null;

  return {
    ...coupon,
    value: Number(coupon.value),
    minimumOrderAmount: coupon.minimumOrderAmount ? Number(coupon.minimumOrderAmount) : null,
    maximumDiscountAmount: coupon.maximumDiscountAmount ? Number(coupon.maximumDiscountAmount) : null,
    targetProductIds: coupon.targetProducts.map((p) => p.productId),
    targetCategoryIds: coupon.targetCategories.map((c) => c.categoryId),
  };
}
