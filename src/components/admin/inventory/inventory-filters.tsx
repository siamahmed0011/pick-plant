import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InventoryFilters } from "@/lib/admin/inventory-listing";

export function InventoryFiltersForm({
  filters,
  categories,
}: {
  filters: InventoryFilters;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <form
      action="/admin/inventory"
      method="get"
      className="surface mt-8 grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(14rem,1.4fr)_repeat(4,minmax(9rem,0.75fr))_auto] xl:items-end"
      aria-label="Inventory search and filters"
    >
      <label className="grid gap-2 text-sm font-semibold">
        Search
        <span className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} aria-hidden="true" />
          <Input name="search" type="search" defaultValue={filters.search} maxLength={100} className="pl-10" placeholder="Name, SKU, or slug" />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Category
        <Select name="category" defaultValue={filters.category}>
          <option value="">All categories</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Stock state
        <Select name="stock" defaultValue={filters.stock}>
          <option value="">All stock states</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Catalog state
        <Select name="catalog" defaultValue={filters.catalog}>
          <option value="">All products</option>
          <option value="ACTIVE">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="FEATURED">Featured</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Sort
        <Select name="sort" defaultValue={filters.sort}>
          <option value="recent">Recently updated</option>
          <option value="oldest">Oldest updated</option>
          <option value="name">Product name</option>
          <option value="stock-asc">Stock ascending</option>
          <option value="stock-desc">Stock descending</option>
          <option value="low-stock">Low stock first</option>
        </Select>
      </label>
      <div className="flex gap-2 xl:justify-end">
        <Button type="submit" className="flex-1 xl:flex-none"><Filter size={17} aria-hidden="true" /> Apply</Button>
        <Link href="/admin/inventory" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)]">Reset</Link>
      </div>
    </form>
  );
}
