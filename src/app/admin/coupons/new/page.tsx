import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin/coupons/coupon-form";

export default async function NewCouponPage() {
  await requireAdmin();

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
  ]);

  return <CouponForm categories={categories} products={products} />;
}
