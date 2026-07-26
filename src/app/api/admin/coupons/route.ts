import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { couponFormSchema } from "@/lib/coupons/coupon-validation";
import { createCoupon } from "@/lib/coupons/coupon-service";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validated = couponFormSchema.parse(body);

    const coupon = await createCoupon(validated);
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
