import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getCouponDetails } from "@/lib/coupons/coupon-listing";
import { CouponForm } from "@/components/admin/coupons/coupon-form";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [coupon, categories, products] = await Promise.all([
    getCouponDetails(id),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
  ]);

  if (!coupon) notFound();

  return <CouponForm initialData={coupon} categories={categories} products={products} />;
}
