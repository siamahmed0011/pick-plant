import { requireAdmin } from "@/lib/auth/guards";
import { getAdminOrdersList } from "@/lib/orders/order-listing";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminOrdersFilters } from "@/components/admin/orders/admin-orders-filters";
import { AdminOrdersTable } from "@/components/admin/orders/admin-orders-table";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

type Props = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
};

export const metadata = {
  title: "Order Management | Admin Pick Plant",
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin("/admin/orders");
  const params = await searchParams;

  const page = params.page ? parseInt(params.page, 10) : 1;
  const status =
    params.status && params.status !== "ALL"
      ? (params.status as OrderStatus)
      : undefined;
  const paymentStatus =
    params.paymentStatus && params.paymentStatus !== "ALL"
      ? (params.paymentStatus as PaymentStatus)
      : undefined;

  const { orders, pagination } = await getAdminOrdersList({
    search: params.search,
    status,
    paymentStatus,
    startDate: params.startDate,
    endDate: params.endDate,
    sortBy: (params.sortBy as "createdAt" | "grandTotal") || "createdAt",
    sortOrder: (params.sortOrder as "asc" | "desc") || "desc",
    page,
    pageSize: 10,
  });

  const rawParams: Record<string, string> = {};
  if (params.search) rawParams.search = params.search;
  if (params.status) rawParams.status = params.status;
  if (params.paymentStatus) rawParams.paymentStatus = params.paymentStatus;
  if (params.startDate) rawParams.startDate = params.startDate;
  if (params.endDate) rawParams.endDate = params.endDate;
  if (params.sortBy) rawParams.sortBy = params.sortBy;
  if (params.sortOrder) rawParams.sortOrder = params.sortOrder;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Order Management"
        description="View customer orders, update order & payment statuses, and manage fulfillment."
      />

      <AdminOrdersFilters />

      <AdminOrdersTable
        orders={orders}
        pagination={pagination}
        searchParams={rawParams}
      />
    </div>
  );
}
