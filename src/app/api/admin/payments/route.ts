import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import {
  verifyManualPayment,
  rejectManualPayment,
  markCodAsPaid,
  refundPayment,
} from "@/lib/payments/payment-service";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { action, transactionId, orderId, reason, note } = body;

    const actor = {
      id: admin.user.id,
      name: admin.user.name || admin.user.email || "Admin",
      role: admin.user.role || "ADMIN",
    };

    if (action === "verify_manual") {
      if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 });
      const res = await verifyManualPayment(transactionId, actor);
      return NextResponse.json(res);
    }

    if (action === "reject_manual") {
      if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 });
      const res = await rejectManualPayment(transactionId, reason || "Payment rejected by admin.", actor);
      return NextResponse.json(res);
    }

    if (action === "mark_cod_paid") {
      if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
      const res = await markCodAsPaid(orderId, actor);
      return NextResponse.json(res);
    }

    if (action === "refund") {
      if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
      const res = await refundPayment(orderId, note || "Refund processed by admin", actor);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid payment action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
