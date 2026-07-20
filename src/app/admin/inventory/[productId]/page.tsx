import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, History, ImageIcon } from "lucide-react";
import { InventoryHistoryTable } from "@/components/admin/inventory/inventory-history-table";
import { StockAdjustmentDialog } from "@/components/admin/inventory/stock-adjustment-dialog";
import { StockStatusBadge } from "@/components/admin/inventory/stock-status-badge";
import { ThresholdDialog } from "@/components/admin/inventory/threshold-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getInventoryProductDetail } from "@/lib/admin/inventory-listing";
import { productIdSchema } from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { productCardImageUrl } from "@/lib/cloudinary-image";
import { formatNumber } from "@/lib/formatters";

export const metadata: Metadata = { title: "Product Inventory", description: "Review product stock and inventory history." };
const dateTime = new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" });

export default async function ProductInventoryPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId: rawProductId } = await params;
  await requireAdmin(`/admin/inventory/${rawProductId}`);
  const parsedId = productIdSchema.safeParse(rawProductId);
  if (!parsedId.success) notFound();
  const product = await getInventoryProductDetail(parsedId.data);
  if (!product) notFound();
  const image = product.images[0];
  const imageUrl = image ? productCardImageUrl(image.publicId, image.secureUrl ?? image.url) : null;
  return (
    <div>
      <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to inventory</Link>
      <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--muted-surface)]">{imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Admin-managed URLs can use arbitrary storage domains.
            <img src={imageUrl} alt={image?.altText ?? `${product.name} product image`} className="size-full object-cover" />
          ) : <ImageIcon aria-hidden="true" />}</span>
          <div className="min-w-0"><p className="text-sm font-semibold text-[var(--primary)]">Product inventory</p><h1 className="truncate text-3xl font-bold sm:text-4xl">{product.name}</h1><p className="mt-1 text-[var(--muted)]">SKU {product.sku} · {product.category.name}</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><StockAdjustmentDialog product={product} /><ThresholdDialog product={product} /><Link href={`/admin/products/${product.id}/edit`} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm font-semibold hover:bg-[var(--muted-surface)]"><ExternalLink size={15} aria-hidden="true" /> Edit product</Link></div>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Product inventory summary">
        <Card className="p-5"><p className="text-sm text-[var(--muted)]">Current stock</p><p className="mt-2 text-3xl font-bold">{formatNumber(product.stockQuantity)}</p></Card>
        <Card className="p-5"><p className="text-sm text-[var(--muted)]">Low-stock threshold</p><p className="mt-2 text-3xl font-bold">{product.lowStockThreshold === null ? "—" : formatNumber(product.lowStockThreshold)}</p></Card>
        <Card className="p-5"><p className="text-sm text-[var(--muted)]">Stock status</p><p className="mt-3"><StockStatusBadge stock={product.stockQuantity} threshold={product.lowStockThreshold} /></p></Card>
        <Card className="p-5"><p className="text-sm text-[var(--muted)]">Catalog status</p><p className="mt-3"><Badge className={product.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>{product.status === "ACTIVE" ? "Published" : "Draft"}</Badge></p></Card>
        <Card className="p-5"><p className="text-sm text-[var(--muted)]">Last updated</p><p className="mt-2 font-bold">{dateTime.format(product.updatedAt)}</p></Card>
      </section>
      <div className="mt-10 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Recent movements</h2><p className="mt-1 text-[var(--muted)]">Latest 20 immutable inventory entries.</p></div><Link href={`/admin/inventory/history?product=${product.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"><History size={16} aria-hidden="true" /> View full history</Link></div>
      <InventoryHistoryTable movements={product.inventoryMovements} compact />
    </div>
  );
}
