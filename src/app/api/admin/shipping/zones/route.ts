import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { shippingZoneFormSchema } from "@/lib/shipping/shipping-validation";
import { createShippingZone } from "@/lib/shipping/shipping-service";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validated = shippingZoneFormSchema.parse(body);

    const zone = await createShippingZone(validated);
    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create shipping zone";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
