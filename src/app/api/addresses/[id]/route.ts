import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(body.recipientName ? { recipientName: body.recipientName.trim() } : {}),
        ...(body.phone ? { phone: body.phone.trim() } : {}),
        ...(body.addressLine1 ? { addressLine1: body.addressLine1.trim() } : {}),
        ...(body.addressLine2 !== undefined ? { addressLine2: body.addressLine2?.trim() || null } : {}),
        ...(body.area !== undefined ? { area: body.area?.trim() || null } : {}),
        ...(body.city ? { city: body.city.trim() } : {}),
        ...(body.district ? { district: body.district.trim() } : {}),
        ...(body.isDefault !== undefined ? { isDefault: Boolean(body.isDefault) } : {}),
      },
    });

    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("PUT /api/addresses/[id] error:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/addresses/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
