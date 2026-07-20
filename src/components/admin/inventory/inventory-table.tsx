"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, History, ImageIcon } from "lucide-react";
import { BulkStockDialog } from "@/components/admin/inventory/bulk-stock-dialog";
import { StockAdjustmentDialog } from "@/components/admin/inventory/stock-adjustment-dialog";
import { StockStatusBadge } from "@/components/admin/inventory/stock-status-badge";
import { ThresholdDialog } from "@/components/admin/inventory/threshold-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatNumber } from "@/lib/formatters";
import type { InventoryListItem } from "@/types/admin-inventory";

const dateTime = new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" });

function Thumbnail({ product }: { product: InventoryListItem }) {
  return (
    <span className="grid size-12 place-items-center overflow-hidden rounded-xl bg-[var(--muted-surface)]">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Admin-managed URLs can use arbitrary storage domains.
        <img src={product.imageUrl} alt={product.imageAlt ?? `${product.name} product image`} className="size-full object-cover" loading="lazy" />
      ) : <ImageIcon size={19} aria-hidden="true" />}
    </span>
  );
}

export function InventoryTable({ products }: { products: InventoryListItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selected = useMemo(() => products.filter((product) => selectedIds.has(product.id)), [products, selectedIds]);
  const allSelected = products.length > 0 && selected.length === products.length;
  if (!products.length) {
    return <Card className="mt-6 grid min-h-64 place-items-center p-6 text-center"><div><h2 className="text-xl font-bold">No inventory products found</h2><p className="mt-2 text-[var(--muted)]">Try adjusting the search or filters.</p></div></Card>;
  }

  return (
    <section className="mt-6" aria-labelledby="inventory-list-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="inventory-list-title" className="text-xl font-bold">Product inventory</h2><p className="text-sm text-[var(--muted)]">{selected.length ? `${selected.length} selected` : "Select products for a bulk update."}</p></div>
        <BulkStockDialog selected={selected} onClear={clearSelection} />
      </div>
      <div className="surface overflow-hidden">
        <Table className="min-w-[1180px] text-sm">
          <caption className="sr-only">Products matching the selected inventory filters</caption>
          <thead className="bg-[var(--muted-surface)] text-[var(--primary)]">
            <tr>
              <th className="px-3 py-3"><input type="checkbox" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? new Set(products.map((product) => product.id)) : new Set())} aria-label="Select all products on this page" /></th>
              <th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Current stock</th><th className="px-3 py-3">Threshold</th><th className="px-3 py-3">Stock status</th><th className="px-3 py-3">Catalog</th><th className="px-3 py-3">Last inventory update</th><th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(product.id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(product.id); else next.delete(product.id); return next; })} aria-label={`Select ${product.name}`} /></td>
                <td className="px-3 py-3"><div className="flex min-w-52 items-center gap-3"><Thumbnail product={product} /><span className="min-w-0"><Link href={`/admin/inventory/${product.id}`} className="block truncate font-bold hover:underline">{product.name}</Link><span className="block truncate text-xs text-[var(--muted)]">SKU {product.sku}</span></span></div></td>
                <td className="px-3 py-3 text-[var(--muted)]">{product.categoryName}</td>
                <td className="px-3 py-3 text-lg font-bold">{formatNumber(product.stockQuantity)}</td>
                <td className="px-3 py-3">{product.lowStockThreshold === null ? "Not set" : formatNumber(product.lowStockThreshold)}</td>
                <td className="px-3 py-3"><StockStatusBadge stock={product.stockQuantity} threshold={product.lowStockThreshold} /></td>
                <td className="px-3 py-3"><Badge className={product.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>{product.status === "ACTIVE" ? "Published" : "Draft"}</Badge>{product.isFeatured && <span className="mt-1 block text-xs text-[var(--muted)]">Featured</span>}</td>
                <td className="px-3 py-3 text-[var(--muted)]">{product.lastInventoryUpdate ? dateTime.format(new Date(product.lastInventoryUpdate)) : "No movements"}</td>
                <td className="px-3 py-3"><div className="flex min-w-72 flex-wrap justify-end gap-1"><StockAdjustmentDialog product={product} /><ThresholdDialog product={product} /><Link href={`/admin/inventory/history?product=${product.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold hover:bg-[var(--muted-surface)]"><History size={15} aria-hidden="true" /> History</Link><Link href={`/admin/products/${product.id}/edit`} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold hover:bg-[var(--muted-surface)]"><ExternalLink size={15} aria-hidden="true" /> Edit</Link></div></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
