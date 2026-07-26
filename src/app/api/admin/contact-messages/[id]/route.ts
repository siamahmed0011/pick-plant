import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { updateContactMessageStatus } from "@/lib/contact/contact-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/contact-messages");
    const { id } = await params;
    const body = await request.json();
    const { status, adminNote } = body;

    const updated = await updateContactMessageStatus(id, status, adminNote);
    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update contact message" }, { status: 500 });
  }
}
