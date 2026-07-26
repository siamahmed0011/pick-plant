import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("GET /api/addresses error:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientName, phone, addressLine1, addressLine2, area, city, district, isDefault } = body;

    if (!recipientName || !phone || !addressLine1 || !city || !district) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        area: area ? area.trim() : null,
        city: city.trim(),
        district: district.trim(),
        isDefault: Boolean(isDefault),
      },
    });

    return NextResponse.json({ address: newAddress });
  } catch (error) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}
