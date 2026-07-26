import "server-only";

import { prisma } from "@/lib/prisma";
import { CouponType } from "@/generated/prisma/enums";
import type { CouponInput } from "@/lib/coupons/coupon-validation";
import { Prisma as PrismaClient } from "@/generated/prisma/client";
const Decimal = PrismaClient.Decimal;

export class CouponError extends Error {}
export class CouponNotFoundError extends CouponError {}
export class CouponValidationError extends CouponError {}

export type CartItemForCoupon = {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
};

export type ValidatedCouponResult = {
  valid: true;
  couponId: string;
  code: string;
  name: string;
  type: CouponType;
  discountAmount: number;
  message?: string;
};

export async function validateAndCalculateCoupon(
  codeRaw: string,
  subtotal: number,
  shippingCost: number,
  cartItems: CartItemForCoupon[],
  userId?: string | null,
  customerEmail?: string | null
): Promise<ValidatedCouponResult> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) throw new CouponValidationError("Please enter a coupon code.");

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: {
      targetProducts: { select: { productId: true } },
      targetCategories: { select: { categoryId: true } },
    },
  });

  if (!coupon) {
    throw new CouponNotFoundError("Coupon code is invalid.");
  }

  if (!coupon.isActive) {
    throw new CouponValidationError("This coupon is currently inactive.");
  }

  const now = new Date();
  if (coupon.startsAt && now < new Date(coupon.startsAt)) {
    throw new CouponValidationError("This coupon is not active yet.");
  }

  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    throw new CouponValidationError("This coupon has expired.");
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new CouponValidationError("This coupon has reached its total usage limit.");
  }

  // Check per-customer usage limit
  if (coupon.usageLimitPerCustomer !== null && (userId || customerEmail)) {
    const customerRedemptions = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(customerEmail ? [{ customerEmail }] : []),
        ],
      },
    });

    if (customerRedemptions >= coupon.usageLimitPerCustomer) {
      throw new CouponValidationError("You have reached your maximum usage limit for this coupon.");
    }
  }

  // Minimum order subtotal check
  const minOrder = coupon.minimumOrderAmount ? Number(coupon.minimumOrderAmount) : 0;
  if (minOrder > 0 && subtotal < minOrder) {
    throw new CouponValidationError(`Your subtotal must be at least ৳ ${minOrder} to use this coupon.`);
  }

  // Product & Category targeting check
  let eligibleSubtotal = subtotal;
  if (!coupon.appliesToAllProducts) {
    const targetProdIds = new Set(coupon.targetProducts.map((p) => p.productId));
    const targetCatIds = new Set(coupon.targetCategories.map((c) => c.categoryId));

    let matchingTotal = 0;
    for (const item of cartItems) {
      const matchProduct = targetProdIds.has(item.productId);
      const matchCategory = item.categoryId ? targetCatIds.has(item.categoryId) : false;
      if (matchProduct || matchCategory) {
        matchingTotal += item.price * item.quantity;
      }
    }

    if (matchingTotal <= 0) {
      throw new CouponValidationError("This coupon does not apply to the selected items in your cart.");
    }

    eligibleSubtotal = matchingTotal;
  }

  // Calculate discount amount
  let discount = 0;
  const val = Number(coupon.value);

  if (coupon.type === CouponType.PERCENTAGE) {
    discount = eligibleSubtotal * (val / 100);
    const maxDiscount = coupon.maximumDiscountAmount ? Number(coupon.maximumDiscountAmount) : null;
    if (maxDiscount !== null && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else if (coupon.type === CouponType.FIXED_AMOUNT) {
    discount = Math.min(val, eligibleSubtotal);
  } else if (coupon.type === CouponType.FREE_SHIPPING) {
    discount = shippingCost;
  }

  discount = Math.max(0, Math.min(discount, subtotal + shippingCost));

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    name: coupon.name,
    type: coupon.type,
    discountAmount: Math.round(discount * 100) / 100,
  };
}

export async function redeemCouponInTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  couponId: string,
  orderId: string,
  userId: string | null | undefined,
  customerEmail: string,
  discountAmount: number
) {
  // Concurrency-safe atomic check and update
  const updated = await tx.coupon.updateMany({
    where: {
      id: couponId,
      OR: [{ usageLimit: null }, { usedCount: { lt: prisma.coupon.fields.usageLimit } }],
    },
    data: {
      usedCount: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    throw new CouponValidationError("This coupon reached its usage limit right before your order was processed.");
  }

  await tx.couponRedemption.create({
    data: {
      couponId,
      orderId,
      userId: userId || null,
      customerEmail,
      discountAmount: new Decimal(discountAmount),
    },
  });
}

export async function createCoupon(input: CouponInput) {
  const code = input.code.trim().toUpperCase();

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw new CouponValidationError(`Coupon code "${code}" already exists.`);

  return prisma.coupon.create({
    data: {
      code,
      name: input.name,
      description: input.description || null,
      type: input.type,
      value: new Decimal(input.value),
      minimumOrderAmount: input.minimumOrderAmount ? new Decimal(input.minimumOrderAmount) : null,
      maximumDiscountAmount: input.maximumDiscountAmount ? new Decimal(input.maximumDiscountAmount) : null,
      usageLimit: input.usageLimit || null,
      usageLimitPerCustomer: input.usageLimitPerCustomer || null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive,
      appliesToAllProducts: input.appliesToAllProducts,
      targetProducts: {
        create: (input.targetProductIds || []).map((id) => ({ productId: id })),
      },
      targetCategories: {
        create: (input.targetCategoryIds || []).map((id) => ({ categoryId: id })),
      },
    },
  });
}

export async function updateCoupon(id: string, input: CouponInput) {
  const code = input.code.trim().toUpperCase();

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new CouponNotFoundError("Coupon not found.");

  if (existing.code !== code) {
    const codeConflict = await prisma.coupon.findUnique({ where: { code } });
    if (codeConflict) throw new CouponValidationError(`Coupon code "${code}" is taken.`);
  }

  return prisma.$transaction(async (tx) => {
    await tx.couponProduct.deleteMany({ where: { couponId: id } });
    await tx.couponCategory.deleteMany({ where: { couponId: id } });

    return tx.coupon.update({
      where: { id },
      data: {
        code,
        name: input.name,
        description: input.description || null,
        type: input.type,
        value: new Decimal(input.value),
        minimumOrderAmount: input.minimumOrderAmount ? new Decimal(input.minimumOrderAmount) : null,
        maximumDiscountAmount: input.maximumDiscountAmount ? new Decimal(input.maximumDiscountAmount) : null,
        usageLimit: input.usageLimit || null,
        usageLimitPerCustomer: input.usageLimitPerCustomer || null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: input.isActive,
        appliesToAllProducts: input.appliesToAllProducts,
        targetProducts: {
          create: (input.targetProductIds || []).map((pId) => ({ productId: pId })),
        },
        targetCategories: {
          create: (input.targetCategoryIds || []).map((cId) => ({ categoryId: cId })),
        },
      },
    });
  });
}
