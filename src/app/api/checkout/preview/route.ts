import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCheckoutPreview } from "@/lib/checkout/checkout-service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const preview = await getCheckoutPreview({
      items: body.items || [],
      shippingDistrict: body.shippingDistrict,
      couponCode: body.couponCode,
      userId: session?.user?.id,
      customerEmail: body.customerEmail || session?.user?.email,
    });

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to calculate checkout preview";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
