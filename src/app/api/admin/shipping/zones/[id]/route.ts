import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { shippingZoneFormSchema } from "@/lib/shipping/shipping-validation";
import { updateShippingZone } from "@/lib/shipping/shipping-service";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const validated = shippingZoneFormSchema.parse(body);

    const zone = await updateShippingZone(id, validated);
    return NextResponse.json(zone);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update shipping zone";
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

    await prisma.shippingZone.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete shipping zone";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
