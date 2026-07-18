import { AlertTriangle, PackageSearch, ShoppingBag, Star, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardOverviewList } from "@/components/admin/dashboard-overview-list";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import { getAdminDashboardData } from "@/lib/admin/dashboard-data";
import { requireAdmin } from "@/lib/auth/guards";

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const dashboard = await getAdminDashboardData();

  const stats = [
    {
      label: "Total products",
      value: dashboard.counts.products,
      description: "All catalog statuses",
      Icon: PackageSearch,
    },
    {
      label: "Total orders",
      value: dashboard.counts.orders,
      description: "All recorded orders",
      Icon: ShoppingBag,
    },
    {
      label: "Total customers",
      value: dashboard.counts.customers,
      description: "Customer-role accounts",
      Icon: Users,
    },
    {
      label: "Total reviews",
      value: dashboard.counts.reviews,
      description: "All moderation statuses",
      Icon: Star,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your Pick Plant store."
        status={null}
      />
      {!dashboard.available && (
        <div
          className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          role="status"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          <p>
            Dashboard data is temporarily unavailable. No database details were exposed; try again
            after the connection is restored.
          </p>
        </div>
      )}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <h2 className="sr-only">Store summary</h2>
        {stats.map((stat) => (
          <DashboardStatCard {...stat} key={stat.label} />
        ))}
      </section>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <DashboardOverviewList
          title="Recent orders"
          description="The five most recently created orders."
          items={dashboard.recentOrders}
          getKey={(order) => order.id}
          emptyMessage={
            dashboard.available
              ? "No orders have been placed yet."
              : "Recent orders are unavailable right now."
          }
          className="xl:col-span-2"
          renderItem={(order) => (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-bold">#{order.orderNumber}</p>
                <p className="truncate text-sm text-[var(--muted)]">{order.customer}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                <Badge className="bg-[var(--muted-surface)] text-[var(--primary)]">
                  {formatStatus(order.status)}
                </Badge>
                <strong className="text-sm">{formatCurrency(order.total)}</strong>
                <time className="text-sm text-[var(--muted)]" dateTime={order.date.toISOString()}>
                  {formatDate(order.date)}
                </time>
              </div>
            </div>
          )}
        />
        <DashboardOverviewList
          title="Low-stock products"
          description="Tracked products at or below their configured threshold."
          items={dashboard.lowStockProducts}
          getKey={(product) => product.id}
          emptyMessage={
            dashboard.available
              ? "No products are currently below their low-stock threshold."
              : "Inventory information is unavailable right now."
          }
          renderItem={(product) => (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{product.name}</p>
                <p className="text-sm text-[var(--muted)]">SKU {product.sku}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-[var(--danger)]">
                  {formatNumber(product.stockQuantity)} left
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Threshold {formatNumber(product.lowStockThreshold)}
                </p>
              </div>
            </div>
          )}
        />
        <DashboardOverviewList
          title="Recent customers"
          description="The five newest customer accounts."
          items={dashboard.recentCustomers}
          getKey={(customer) => customer.id}
          emptyMessage={
            dashboard.available
              ? "No customer accounts have been created yet."
              : "Customer information is unavailable right now."
          }
          renderItem={(customer) => (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-bold">{customer.name ?? "Unnamed customer"}</p>
                <p className="truncate text-sm text-[var(--muted)]">
                  {customer.email ?? "No email address"}
                </p>
              </div>
              <time
                className="shrink-0 text-sm text-[var(--muted)]"
                dateTime={customer.createdAt.toISOString()}
              >
                {formatDate(customer.createdAt)}
              </time>
            </div>
          )}
        />
      </div>
    </div>
  );
}
