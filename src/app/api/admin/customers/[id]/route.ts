import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminCustomerById } from "@/lib/admin/customers-data";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/customers");
    const { id } = await params;
    const customer = await getAdminCustomerById(id);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch customer details" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/customers");
    const { id } = await params;
    const body = await request.json();

    const { isActive, role } = body;

    const dataToUpdate: { isActive?: boolean; role?: Role } = {};
    if (typeof isActive === "boolean") dataToUpdate.isActive = isActive;
    if (typeof role === "string" && (role === "ADMIN" || role === "CUSTOMER")) {
      dataToUpdate.role = role as Role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
