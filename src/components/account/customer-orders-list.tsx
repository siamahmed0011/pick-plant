import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronRight, PackageCheck } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

type OrderItemSummary = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productImageUrl: string | null;
};

type CustomerOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  grandTotal: number;
  createdAt: Date | string;
  items: OrderItemSummary[];
};

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
      return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    case OrderStatus.CONFIRMED:
      return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
    case OrderStatus.PROCESSING:
      return <Badge className="bg-purple-100 text-purple-800">Processing</Badge>;
    case OrderStatus.SHIPPED:
      return <Badge className="bg-indigo-100 text-indigo-800">Shipped</Badge>;
    case OrderStatus.DELIVERED:
      return <Badge className="bg-emerald-100 text-emerald-800">Delivered</Badge>;
    case OrderStatus.CANCELLED:
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
    case OrderStatus.RETURNED:
      return <Badge className="bg-gray-100 text-gray-800">Returned</Badge>;
    case OrderStatus.REFUNDED:
      return <Badge className="bg-orange-100 text-orange-800">Refunded</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getPaymentBadge(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>;
    case PaymentStatus.PENDING:
    case PaymentStatus.UNPAID:
      return <Badge className="bg-amber-100 text-amber-800">Unpaid</Badge>;
    case PaymentStatus.FAILED:
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    case PaymentStatus.REFUNDED:
      return <Badge className="bg-orange-100 text-orange-800">Refunded</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function CustomerOrdersList({ orders }: { orders: CustomerOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <Card className="p-10 text-center">
        <PackageCheck className="mx-auto size-12 text-[var(--muted)]" />
        <h2 className="mt-4 text-xl font-bold">No orders found</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">You haven&apos;t placed any orders yet.</p>
        <Link
          href="/plants"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-5 font-semibold text-white transition hover:bg-[var(--primary-hover)] text-sm"
        >
          Explore Plants
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-6 transition hover:shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <span className="font-mono font-bold text-lg text-[var(--primary)]">
                {order.orderNumber}
              </span>
              <p className="text-xs text-[var(--muted)]">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(order.status)}
              {getPaymentBadge(order.paymentStatus)}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 shrink-0">
                  <img
                    src={item.productImageUrl || "/images/placeholders/plant.svg"}
                    alt={item.productName}
                    className="size-12 rounded-lg object-cover bg-[var(--muted-surface)]"
                  />
                  <div className="hidden md:block min-w-0">
                    <p className="text-xs font-bold truncate max-w-[140px]">{item.productName}</p>
                    <p className="text-xs text-[var(--muted)]">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
              {order.items.length > 3 && (
                <span className="text-xs font-semibold text-[var(--muted)]">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6">
              <div className="text-right">
                <p className="text-xs text-[var(--muted)]">Total Amount</p>
                <p className="font-bold text-base text-[var(--primary)]">
                  {formatCurrency(order.grandTotal)}
                </p>
              </div>

              <Link
                href={`/account/orders/${order.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                Details <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
