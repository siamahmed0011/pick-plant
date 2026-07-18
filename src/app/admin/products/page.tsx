import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ProductTable } from "@/components/admin/products/product-table";
import {
  PRODUCT_PAGE_SIZE,
  getAdminProductListing,
  parseAdminProductFilters,
  productFiltersToSearchParams,
} from "@/lib/admin/product-listing";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse and filter the Pick Plant product catalog.",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/products");
  const rawSearchParams = await searchParams;
  const filters = parseAdminProductFilters(rawSearchParams);
  const listing = await getAdminProductListing(filters);
  const successMessage =
    rawSearchParams.created === "1"
      ? "Product created successfully."
      : rawSearchParams.updated === "1"
        ? "Product updated successfully."
        : rawSearchParams.deleted === "1"
          ? "Product deleted successfully."
          : null;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <AdminPageHeader
          title="Products"
          description="Search, filter, and review the products in your store catalog."
          status={null}
        />
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
        >
          <Plus size={17} aria-hidden="true" /> Add Product
        </Link>
      </div>
      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status">
          <CheckCircle2 size={19} aria-hidden="true" />
          <p>{successMessage}</p>
        </div>
      )}
      <ProductFilters filters={{ ...filters, page: listing.currentPage }} categories={listing.categories} />
      {!listing.available ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          <p>Products are temporarily unavailable. Try again after the database connection is restored.</p>
        </div>
      ) : (
        <>
          <ProductTable products={listing.items} />
          <AdminPagination
            basePath="/admin/products"
            params={productFiltersToSearchParams(filters)}
            currentPage={listing.currentPage}
            totalPages={listing.totalPages}
            totalItems={listing.totalItems}
            pageSize={PRODUCT_PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
