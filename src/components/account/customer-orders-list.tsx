import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/account/status-badge";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { formatCurrency, formatDate } from "@/lib/formatters";

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

export function CustomerOrdersList({ orders }: { orders: CustomerOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-6 sm:p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD] mb-3">
          <Package size={22} />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[#1F2D22]">No orders yet</h2>
        <p className="mt-1 text-xs text-[#66746A] max-w-sm mx-auto leading-relaxed">
          Your plant orders will appear here after checkout. Browse our nursery collection to find your first plant.
        </p>
        <div className="mt-4">
          <Link
            href="/plants"
            className="inline-flex h-10 items-center justify-center rounded-[14px] bg-[#1E5A3A] px-5 text-xs font-semibold text-white transition hover:bg-[#17482F] shadow-xs"
          >
            Explore plants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="group rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-[#1E5A3A]/40 hover:-translate-y-0.5 transition-all duration-150"
        >
          {/* Top Bar: Order Number, Date, Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE7DD] pb-3.5">
            <div>
              <span className="font-mono text-base font-bold text-[#1E5A3A]">
                {order.orderNumber}
              </span>
              <p className="text-xs text-[#66746A] mt-0.5">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>

          {/* Item Thumbnails & Amount Details */}
          <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 shrink-0">
                  <div className="relative size-12 shrink-0 rounded-xl overflow-hidden bg-[#EEF5F0] border border-[#DDE7DD]">
                    <Image
                      src={item.productImageUrl || "/images/placeholders/plant.svg"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="hidden md:block min-w-0">
                    <p className="text-xs font-bold text-[#1F2D22] truncate max-w-[130px]">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-[#66746A]">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}

              {order.items.length > 3 && (
                <span className="text-xs font-semibold text-[#66746A] bg-[#EEF5F0] px-2.5 py-1 rounded-lg border border-[#DDE7DD]">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DDE7DD]">
              <div className="text-left sm:text-right">
                <p className="text-[11px] text-[#7A877F]">Total Amount</p>
                <p className="font-bold text-base text-[#1F2D22]">
                  {formatCurrency(order.grandTotal)}
                </p>
              </div>

              <Link
                href={`/account/orders/${order.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] px-3.5 text-xs font-bold text-[#1E5A3A] hover:bg-[#EEF5F0] transition"
              >
                View details <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
