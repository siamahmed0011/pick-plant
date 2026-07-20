import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { InventoryHistoryFiltersForm } from "@/components/admin/inventory/inventory-history-filters";
import { InventoryHistoryTable } from "@/components/admin/inventory/inventory-history-table";
import {
  INVENTORY_HISTORY_PAGE_SIZE,
  getInventoryHistory,
  inventoryHistoryFiltersToSearchParams,
  parseInventoryHistoryFilters,
} from "@/lib/admin/inventory-listing";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Inventory History", description: "Read-only inventory movement audit history." };

export default async function InventoryHistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/admin/inventory/history");
  const filters = parseInventoryHistoryFilters(await searchParams);
  const history = await getInventoryHistory(filters);
  return (
    <div>
      <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to inventory</Link>
      <div className="mt-5"><AdminPageHeader title="Inventory movement history" description="Review the immutable audit trail for every recorded stock change." status="Read only" /></div>
      <InventoryHistoryFiltersForm filters={{ ...filters, page: history.currentPage }} products={history.products} actors={history.actors} />
      <InventoryHistoryTable movements={history.movements} />
      <AdminPagination basePath="/admin/inventory/history" params={inventoryHistoryFiltersToSearchParams(filters)} currentPage={history.currentPage} totalPages={history.totalPages} totalItems={history.totalItems} pageSize={INVENTORY_HISTORY_PAGE_SIZE} />
    </div>
  );
}
