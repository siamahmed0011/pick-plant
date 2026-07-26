import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { couponFormSchema } from "@/lib/coupons/coupon-validation";
import { updateCoupon } from "@/lib/coupons/coupon-service";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const validated = couponFormSchema.parse(body);

    const coupon = await updateCoupon(id, validated);
    return NextResponse.json(coupon);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
