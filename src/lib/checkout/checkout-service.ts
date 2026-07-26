import "server-only";

import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@/generated/prisma/enums";
import { validateAndCalculateCoupon } from "@/lib/coupons/coupon-service";
import { calculateShippingCost } from "@/lib/shipping/shipping-service";
import { getAvailablePaymentMethods } from "@/lib/payments/payment-service";

export class CheckoutPreviewError extends Error {}

export type CartItemPreviewInput = {
  productId: string;
  quantity: number;
};

export type CheckoutPreviewOptions = {
  items: CartItemPreviewInput[];
  shippingDistrict?: string | null;
  couponCode?: string | null;
  userId?: string | null;
  customerEmail?: string | null;
};

export async function getCheckoutPreview(options: CheckoutPreviewOptions) {
  if (!options.items || options.items.length === 0) {
    throw new CheckoutPreviewError("Your cart is empty.");
  }

  // 1. Revalidate live DB product prices & stock
  const productIds = options.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  if (products.length !== options.items.length) {
    throw new CheckoutPreviewError("One or more items in your cart are no longer available.");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const itemsPreview = [];

  for (const itemInput of options.items) {
    const product = productMap.get(itemInput.productId);
    if (!product) {
      throw new CheckoutPreviewError("Product not found.");
    }
    if (product.status !== ProductStatus.ACTIVE) {
      throw new CheckoutPreviewError(`"${product.name}" is not available for purchase.`);
    }
    if (product.stockQuantity < itemInput.quantity) {
      throw new CheckoutPreviewError(
        `Insufficient stock for "${product.name}". Only ${product.stockQuantity} remaining.`
      );
    }

    const price = Number(product.price);
    const lineTotal = price * itemInput.quantity;
    subtotal += lineTotal;

    itemsPreview.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.url || product.images[0]?.secureUrl || null,
      price,
      quantity: itemInput.quantity,
      lineTotal,
      categoryId: product.category.id,
    });
  }

  // 2. Calculate shipping cost from district/city location
  const district = options.shippingDistrict || "Dhaka";
  const shippingResult = await calculateShippingCost(district, subtotal);

  // 3. Validate and calculate coupon discount if code provided
  let couponInfo = null;
  let couponDiscount = 0;

  if (options.couponCode && options.couponCode.trim()) {
    try {
      const couponRes = await validateAndCalculateCoupon(
        options.couponCode,
        subtotal,
        shippingResult.shippingCost,
        itemsPreview.map((i) => ({
          productId: i.productId,
          categoryId: i.categoryId,
          price: i.price,
          quantity: i.quantity,
        })),
        options.userId,
        options.customerEmail
      );
      couponInfo = couponRes;
      couponDiscount = couponRes.discountAmount;
    } catch (error) {
      if (error instanceof Error) {
        throw new CheckoutPreviewError(error.message);
      }
      throw error;
    }
  }

  const grandTotal = Math.max(0, Math.round((subtotal + shippingResult.shippingCost - couponDiscount) * 100) / 100);

  return {
    items: itemsPreview,
    subtotal: Math.round(subtotal * 100) / 100,
    shippingInfo: shippingResult,
    couponInfo,
    couponDiscount,
    grandTotal,
    availablePaymentMethods: getAvailablePaymentMethods(),
  };
}
