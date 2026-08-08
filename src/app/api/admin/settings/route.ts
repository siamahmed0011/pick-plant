import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getStoreSettings, updateStoreSettings } from "@/lib/admin/settings-service";

export async function GET() {
  try {
    await requireAdmin("/admin/settings");
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin("/admin/settings");
    const body = await request.json();

    const updated = await updateStoreSettings(body);
    return NextResponse.json({ success: true, settings: updated, message: "Store settings saved successfully!" });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
