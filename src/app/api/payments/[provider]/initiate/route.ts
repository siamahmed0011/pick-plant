import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentProvider } from "@/generated/prisma/enums";
import { getPaymentAdapter } from "@/lib/payments/payment-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await auth();
    const { provider: rawProvider } = await params;
    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ownership check: if order belongs to a user, verify session
    if (order.userId && session?.user?.id !== order.userId && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    const adapter = getPaymentAdapter(providerEnum);
    if (!adapter.isEnabled()) {
      return NextResponse.json(
        { error: `${providerEnum} online payment gateway is disabled or missing configuration credentials.` },
        { status: 400 }
      );
    }

    const result = await adapter.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.grandTotal),
      currency: order.currency,
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "customer@example.com",
      customerPhone: order.customerPhone || "N/A",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/${rawProvider.toLowerCase()}/callback`,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
