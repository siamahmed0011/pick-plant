import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Truck, CreditCard } from "lucide-react";

type Props = {
  searchParams: Promise<{ orderNumber?: string }>;
};

export const metadata = {
  title: "Order Placed Successfully | Pick Plant",
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderNumber } = await searchParams;

  if (!orderNumber) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Card className="p-8 text-center border-emerald-100 bg-emerald-50/30">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-[var(--primary)]">Thank You for Your Order!</h1>
        <p className="mt-2 text-[var(--muted)]">
          Your order has been placed successfully. We are preparing your plants for delivery.
        </p>

        <div className="mt-6 inline-block rounded-xl bg-white border px-6 py-3 font-mono font-bold text-lg text-[var(--primary)] shadow-sm">
          Order Number: <span className="text-emerald-700">{order.orderNumber}</span>
        </div>
      </Card>

      <div className="mt-8 space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[var(--primary)] border-b pb-3 flex items-center gap-2">
            <ShoppingBag className="size-5" /> Order Summary
          </h2>

          <ul className="divide-y my-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-3 items-center">
                <img
                  src={item.productImageUrl || "/images/placeholders/plant.svg"}
                  alt={item.productName}
                  className="size-14 rounded-lg object-cover bg-[var(--muted-surface)]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Qty: {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                  </p>
                </div>
                <div className="font-bold text-sm">
                  {formatCurrency(Number(item.lineTotal))}
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span className="font-semibold text-black">{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Shipping Fee</span>
              <span className="font-semibold text-black">{formatCurrency(Number(order.shippingTotal))}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-3 text-[var(--primary)]">
              <span>Grand Total</span>
              <span>{formatCurrency(Number(order.grandTotal))}</span>
            </div>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-[var(--primary)] flex items-center gap-2 mb-2">
              <Truck className="size-4" /> Shipping Address
            </h3>
            <p className="font-bold text-sm">{order.customerName}</p>
            <p className="text-xs text-[var(--muted)]">{order.customerPhone}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {order.shippingCity}, {order.shippingDistrict} {order.shippingPostalCode || ""}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-[var(--primary)] flex items-center gap-2 mb-2">
              <CreditCard className="size-4" /> Payment Details
            </h3>
            <p className="text-sm font-semibold">
              Method: <span className="font-normal">{order.paymentMethod || "Cash on Delivery"}</span>
            </p>
            <p className="text-sm font-semibold mt-1">
              Payment Status: <span className="font-normal">{order.paymentStatus}</span>
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              Placed On: {formatDate(order.createdAt)}
            </p>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/account/orders">
            <Button variant="outline" className="w-full sm:w-auto">
              View Order History
            </Button>
          </Link>
          <Link href="/plants">
            <Button variant="primary" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
