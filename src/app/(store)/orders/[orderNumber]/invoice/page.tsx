import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderCashMemo } from "@/components/orders/order-cash-memo";

type Props = {
  params: Promise<{ orderNumber: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { orderNumber } = await params;
  return {
    title: `Cash Memo #${orderNumber} | Pick Plant`,
  };
}

export default async function OrderInvoicePage({ params }: Props) {
  const { orderNumber } = await params;

  if (!orderNumber) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const memoData = {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddressLine1: order.shippingAddressLine1,
    shippingAddressLine2: order.shippingAddressLine2,
    shippingCity: order.shippingCity,
    shippingDistrict: order.shippingDistrict,
    shippingArea: order.shippingArea,
    shippingPostalCode: order.shippingPostalCode,
    customerNote: order.customerNote,
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider,
    paymentStatus: order.paymentStatus,
    status: order.status,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shippingTotal),
    discountTotal: Number(order.discountTotal || 0),
    couponCode: order.couponCode,
    shippingZoneName: order.shippingZoneName,
    grandTotal: Number(order.grandTotal),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };

  return (
    <OrderCashMemo
      order={memoData}
      backUrl={`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`}
    />
  );
}
