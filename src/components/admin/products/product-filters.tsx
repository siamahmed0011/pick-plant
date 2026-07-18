import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminProductFilters } from "@/lib/admin/product-listing";

export function ProductFilters({
  filters,
  categories,
}: {
  filters: AdminProductFilters;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <form
      action="/admin/products"
      method="get"
      className="surface mt-8 grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(15rem,1.4fr)_repeat(4,minmax(9rem,0.7fr))_auto] xl:items-end"
      aria-label="Product search and filters"
    >
      <label className="grid gap-2 text-sm font-semibold">
        Search
        <span className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} aria-hidden="true" />
          <Input
            name="search"
            type="search"
            defaultValue={filters.search}
            maxLength={100}
            className="pl-10"
            placeholder="Name, SKU, or category"
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Category
        <Select name="category" defaultValue={filters.category}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>{category.name}</option>
          ))}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Status
        <Select name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Featured
        <Select name="featured" defaultValue={filters.featured}>
          <option value="">All products</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Sort
        <Select name="sort" defaultValue={filters.sort}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A–Z</option>
          <option value="stock">Stock: Low to High</option>
          <option value="price">Price: Low to High</option>
        </Select>
      </label>
      <div className="flex gap-2 xl:justify-end">
        <Button type="submit" className="flex-1 xl:flex-none">
          <Filter size={17} aria-hidden="true" /> Apply
        </Button>
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)]"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
