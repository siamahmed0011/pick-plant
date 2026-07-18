import Link from "next/link";
import { ImageIcon, PackageSearch, Plus } from "lucide-react";
import {
  ProductFeaturedToggle,
  ProductManagementActions,
  ProductPublishingToggle,
} from "@/components/admin/products/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type { AdminProductListItem } from "@/lib/admin/product-listing";

function ProductThumbnail({ product }: { product: AdminProductListItem }) {
  const src = product.imageUrl ?? "/images/placeholders/plant.svg";
  return (
    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--muted-surface)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Admin-managed URLs may use arbitrary storage domains.
        <img
          src={src}
          alt={product.imageAlt ?? `${product.name} product image`}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <ImageIcon size={20} aria-hidden="true" />
      )}
    </div>
  );
}

function StockStatus({ product }: { product: AdminProductListItem }) {
  const outOfStock = product.stockQuantity === 0;
  const lowStock =
    !outOfStock &&
    product.lowStockThreshold !== null &&
    product.stockQuantity <= product.lowStockThreshold;
  const label = outOfStock ? "Out of stock" : lowStock ? "Low stock" : "In stock";
  const className = outOfStock
    ? "bg-red-100 text-red-800"
    : lowStock
      ? "bg-amber-100 text-amber-900"
      : "bg-emerald-100 text-emerald-800";

  return (
    <div className="grid gap-1">
      <span className="font-semibold">{formatNumber(product.stockQuantity)}</span>
      <Badge className={`${className} w-fit`}>{label}</Badge>
    </div>
  );
}

export function ProductTable({ products }: { products: AdminProductListItem[] }) {
  if (!products.length) {
    return (
      <Card className="mt-6 grid min-h-80 place-items-center p-6 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--muted-surface)] text-[var(--primary)]">
            <PackageSearch size={25} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-bold">No products found</h2>
          <p className="mt-2 text-[var(--muted)]">Try adjusting the search or filters.</p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            <Plus size={17} aria-hidden="true" /> Add Product
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <section className="mt-6" aria-labelledby="product-list-title">
      <h2 id="product-list-title" className="sr-only">Product list</h2>
      <div className="surface hidden overflow-hidden xl:block">
        <Table className="table-fixed text-sm">
          <caption className="sr-only">Products matching the selected admin filters</caption>
          <thead className="bg-[var(--muted-surface)] text-[var(--primary)]">
            <tr>
              <th className="w-[6%] px-3 py-3 font-bold">Image</th>
              <th className="w-[18%] px-3 py-3 font-bold">Product</th>
              <th className="w-[12%] px-3 py-3 font-bold">Category</th>
              <th className="w-[9%] px-3 py-3 font-bold">Price</th>
              <th className="w-[11%] px-3 py-3 font-bold">Stock</th>
              <th className="w-[12%] px-3 py-3 font-bold">Status</th>
              <th className="w-[13%] px-3 py-3 font-bold">Featured</th>
              <th className="w-[11%] px-3 py-3 font-bold">Created</th>
              <th className="w-[8%] px-3 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-3 py-3"><ProductThumbnail product={product} /></td>
                <td className="px-3 py-3">
                  <p className="truncate font-bold">{product.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">SKU {product.sku}</p>
                </td>
                <td className="truncate px-3 py-3 text-[var(--muted)]">{product.categoryName}</td>
                <td className="px-3 py-3 font-semibold">{formatCurrency(product.price)}</td>
                <td className="px-3 py-3"><StockStatus product={product} /></td>
                <td className="px-3 py-3"><ProductPublishingToggle product={product} /></td>
                <td className="px-3 py-3"><ProductFeaturedToggle product={product} /></td>
                <td className="px-3 py-3 text-[var(--muted)]">{formatDate(product.createdAt)}</td>
                <td className="px-3 py-3"><ProductManagementActions product={product} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="grid gap-4 xl:hidden sm:grid-cols-2">
        {products.map((product) => (
          <Card className="flex min-w-0 flex-col p-5" key={product.id}>
            <div className="flex min-w-0 gap-4">
              <ProductThumbnail product={product} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold">{product.name}</h3>
                <p className="truncate text-xs text-[var(--muted)]">SKU {product.sku}</p>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{product.categoryName}</p>
              </div>
              <div className="shrink-0"><ProductPublishingToggle product={product} /></div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-4 text-sm">
              <div><dt className="text-[var(--muted)]">Price</dt><dd className="font-bold">{formatCurrency(product.price)}</dd></div>
              <div><dt className="text-[var(--muted)]">Stock</dt><dd className="mt-1"><StockStatus product={product} /></dd></div>
              <div><dt className="text-[var(--muted)]">Featured</dt><dd className="mt-1"><ProductFeaturedToggle product={product} /></dd></div>
              <div><dt className="text-[var(--muted)]">Created</dt><dd className="font-bold">{formatDate(product.createdAt)}</dd></div>
            </dl>
            <div className="mt-auto pt-3"><ProductManagementActions product={product} /></div>
          </Card>
        ))}
      </div>
    </section>
  );
}
