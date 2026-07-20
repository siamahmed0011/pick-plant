import Link from "next/link";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { inventoryHistoryMovementTypes } from "@/lib/admin/inventory-validation";
import type { InventoryHistoryFilters } from "@/lib/admin/inventory-listing";

function movementLabel(value: string) {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

export function InventoryHistoryFiltersForm({
  filters,
  products,
  actors,
}: {
  filters: InventoryHistoryFilters;
  products: Array<{ id: string; name: string; sku: string }>;
  actors: Array<{ performedById: string | null; performedByName: string | null; performedByEmail: string | null }>;
}) {
  return (
    <form action="/admin/inventory/history" method="get" className="surface mt-8 grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-7 xl:items-end" aria-label="Inventory history filters">
      <label className="grid gap-2 text-sm font-semibold">Product<Select name="product" defaultValue={filters.product}><option value="">All products</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name} — {product.sku}</option>)}</Select></label>
      <label className="grid gap-2 text-sm font-semibold">Movement type<Select name="type" defaultValue={filters.type}><option value="">All movement types</option>{inventoryHistoryMovementTypes.map((type) => <option value={type} key={type}>{movementLabel(type)}</option>)}</Select></label>
      <label className="grid gap-2 text-sm font-semibold">Performed by<Select name="actor" defaultValue={filters.actor}><option value="">All admins</option>{actors.map((actor) => actor.performedById ? <option value={actor.performedById} key={actor.performedById}>{actor.performedByName ?? actor.performedByEmail ?? "Admin"}</option> : null)}</Select></label>
      <label className="grid gap-2 text-sm font-semibold">Direction<Select name="direction" defaultValue={filters.direction}><option value="">All changes</option><option value="POSITIVE">Positive</option><option value="NEGATIVE">Negative</option></Select></label>
      <label className="grid gap-2 text-sm font-semibold">Date from<Input name="dateFrom" type="date" defaultValue={filters.dateFrom} /></label>
      <label className="grid gap-2 text-sm font-semibold">Date to<Input name="dateTo" type="date" defaultValue={filters.dateTo} /></label>
      <div className="flex gap-2"><Button type="submit" className="flex-1"><Filter size={17} aria-hidden="true" /> Apply</Button><Link href="/admin/inventory/history" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)]">Reset</Link></div>
    </form>
  );
}
