import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/reviews");
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["PENDING", "PUBLISHED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid review status" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/reviews");
    const { id } = await params;

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
