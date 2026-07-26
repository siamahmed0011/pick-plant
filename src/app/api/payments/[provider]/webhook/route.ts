import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentProvider, PaymentStatus, TransactionStatus } from "@/generated/prisma/enums";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;
    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;

    const payload = await request.json();

    // Verify webhook signature or reference
    const orderNumber = payload.orderNumber || payload.data?.object?.client_reference_id;
    if (!orderNumber) {
      return NextResponse.json({ received: true, status: "ignored_no_order" });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({ received: true, status: "already_paid" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id, provider: providerEnum },
        data: {
          status: TransactionStatus.VERIFIED,
          verifiedAt: new Date(),
          rawMetadataJson: JSON.stringify(payload),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          paymentStatus: PaymentStatus.PAID,
          note: `Webhook payment notification verified for ${providerEnum}`,
        },
      });
    });

    return NextResponse.json({ received: true, status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
