import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { Eye, PackageSearch } from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";

export type AdminOrdersListItem = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  grandTotal: number;
  createdAt: Date | string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    productImageUrl: string | null;
  }>;
};

type Props = {
  orders: AdminOrdersListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  searchParams: Record<string, string>;
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case OrderStatus.PENDING:
      return <Badge className="bg-amber-100 text-amber-900 border-amber-200">Pending</Badge>;
    case OrderStatus.CONFIRMED:
      return <Badge className="bg-blue-100 text-blue-900 border-blue-200">Confirmed</Badge>;
    case OrderStatus.PROCESSING:
      return <Badge className="bg-purple-100 text-purple-900 border-purple-200">Processing</Badge>;
    case OrderStatus.SHIPPED:
      return <Badge className="bg-indigo-100 text-indigo-900 border-indigo-200">Shipped</Badge>;
    case OrderStatus.DELIVERED:
      return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200">Delivered</Badge>;
    case OrderStatus.CANCELLED:
      return <Badge className="bg-red-100 text-red-900 border-red-200">Cancelled</Badge>;
    case OrderStatus.RETURNED:
      return <Badge className="bg-gray-100 text-gray-900 border-gray-200">Returned</Badge>;
    case OrderStatus.REFUNDED:
      return <Badge className="bg-orange-100 text-orange-900 border-orange-200">Refunded</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
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

export function AdminOrdersTable({ orders, pagination, searchParams }: Props) {
  if (orders.length === 0) {
    return (
      <Card className="mt-6 grid min-h-80 place-items-center p-6 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--muted-surface)] text-[var(--primary)]">
            <PackageSearch size={25} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-bold">No orders found</h2>
          <p className="mt-2 text-[var(--muted)]">Try adjusting search parameters or filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <section className="mt-6" aria-labelledby="order-list-title">
      <h2 id="order-list-title" className="sr-only">Order list</h2>

      {/* Desktop Table View */}
      <div className="surface hidden overflow-hidden xl:block">
        <Table className="table-fixed text-sm">
          <thead className="bg-[var(--muted-surface)] text-[var(--primary)]">
            <tr>
              <th className="w-[16%] px-4 py-3 font-bold">Order #</th>
              <th className="w-[22%] px-4 py-3 font-bold">Customer</th>
              <th className="w-[14%] px-4 py-3 font-bold">Date</th>
              <th className="w-[12%] px-4 py-3 font-bold">Total</th>
              <th className="w-[14%] px-4 py-3 font-bold">Order Status</th>
              <th className="w-[12%] px-4 py-3 font-bold">Payment</th>
              <th className="w-[10%] px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[var(--muted-surface)]/50 transition">
                <td className="px-4 py-3 font-mono font-bold text-[var(--primary)]">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold truncate text-sm">
                    {order.customerName || "Guest Customer"}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {order.customerEmail || order.customerPhone || "No contact info"}
                  </p>
                </td>
                <td className="px-4 py-3 text-[var(--muted)] text-xs">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 font-bold">{formatCurrency(order.grandTotal)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-white text-[var(--primary)] transition shadow-sm"
                  >
                    <Eye size={14} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Mobile / Tablet Card View */}
      <div className="grid gap-4 xl:hidden sm:grid-cols-2">
        {orders.map((order) => (
          <Card className="flex flex-col p-5" key={order.id}>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-mono font-bold text-[var(--primary)]">{order.orderNumber}</span>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="my-3 space-y-1">
              <p className="font-bold text-sm">{order.customerName || "Guest Customer"}</p>
              <p className="text-xs text-[var(--muted)]">{order.customerEmail}</p>
              <p className="text-xs text-[var(--muted)]">{order.customerPhone}</p>
            </div>

            <div className="mt-auto border-t pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted)]">Total Amount</p>
                <p className="font-bold text-sm text-[var(--primary)]">
                  {formatCurrency(order.grandTotal)}
                </p>
              </div>

              <Link
                href={`/admin/orders/${order.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)] transition"
              >
                <Eye size={14} /> View Order
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <AdminPagination
        basePath="/admin/orders"
        params={searchParams}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalCount}
        pageSize={pagination.pageSize}
      />
    </section>
  );
}
