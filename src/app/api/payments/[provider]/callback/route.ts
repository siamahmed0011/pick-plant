import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentProvider, PaymentStatus } from "@/generated/prisma/enums";
import { getPaymentAdapter } from "@/lib/payments/payment-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;
    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;

    const contentType = request.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const searchParams = new URLSearchParams(text);
      payload = Object.fromEntries(searchParams.entries());
    } else {
      payload = await request.json();
    }

    const adapter = getPaymentAdapter(providerEnum);
    const verification = await adapter.verifyPayment(payload);

    const orderNumber =
      (payload.tran_id as string) ||
      (payload.client_reference_id as string) ||
      (payload.orderNumber as string);

    if (!orderNumber) {
      return NextResponse.json({ error: "Order reference missing in callback" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency check: if order is already paid, ignore duplicate callback
    if (order.paymentStatus === PaymentStatus.PAID && verification.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderNumber=${order.orderNumber}`);
    }

    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.paymentTransaction.findFirst({
        where: { orderId: order.id, provider: providerEnum },
      });

      if (existingTx) {
        await tx.paymentTransaction.update({
          where: { id: existingTx.id },
          data: {
            status: verification.status,
            providerReference: verification.providerReference || existingTx.providerReference,
            verifiedAt: verification.success ? new Date() : undefined,
            failedAt: !verification.success ? new Date() : undefined,
            failureReason: verification.failureReason || null,
            rawMetadataJson: verification.rawMetadataJson || null,
          },
        });
      }

      const newPaymentStatus = verification.success ? PaymentStatus.PAID : PaymentStatus.FAILED;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          paymentStatus: newPaymentStatus,
          note: `${providerEnum} callback processed: ${
            verification.success ? "Payment Successful" : verification.failureReason || "Payment Failed"
          }`,
        },
      });
    });

    if (verification.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderNumber=${order.orderNumber}`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=payment_failed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Callback processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  return POST(request, props);
}
