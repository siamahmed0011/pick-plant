import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { InventoryFiltersForm } from "@/components/admin/inventory/inventory-filters";
import { InventorySummaryCards } from "@/components/admin/inventory/inventory-summary-cards";
import { InventoryTable } from "@/components/admin/inventory/inventory-table";
import {
  INVENTORY_PAGE_SIZE,
  getInventoryDashboard,
  inventoryFiltersToSearchParams,
  parseInventoryFilters,
} from "@/lib/admin/inventory-listing";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Review stock levels and manage inventory movements.",
};

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/inventory");
  const filters = parseInventoryFilters(await searchParams);
  const dashboard = await getInventoryDashboard(filters);
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <AdminPageHeader title="Inventory" description="Monitor stock, record adjustments, and keep a complete movement ledger." status={null} />
        <Link href="/admin/inventory/history" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--primary)] px-5 font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)]"><History size={17} aria-hidden="true" /> Movement history</Link>
      </div>
      <InventorySummaryCards summary={dashboard.summary} />
      <InventoryFiltersForm filters={{ ...filters, page: dashboard.currentPage }} categories={dashboard.categories} />
      <InventoryTable products={dashboard.items} />
      <AdminPagination basePath="/admin/inventory" params={inventoryFiltersToSearchParams(filters)} currentPage={dashboard.currentPage} totalPages={dashboard.totalPages} totalItems={dashboard.totalItems} pageSize={INVENTORY_PAGE_SIZE} />
    </div>
  );
}
