import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { ProductCreateForm } from "@/components/admin/products/product-create-form";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { ProductCategoryOption } from "@/types/admin-product";

export const metadata: Metadata = {
  title: "Add Product",
  description: "Add a new plant to the Pick Plant catalog.",
};

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  let categories: ProductCategoryOption[] = [];
  let available = true;

  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    if (process.env.NODE_ENV !== "production") {
      console.info("[admin/products/new] Loaded active categories:", categories);
    }
  } catch (error) {
    available = false;
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
      console.error("Product categories could not be loaded.", {
        name: error instanceof Error ? error.name : "UnknownError",
        code,
        message: error instanceof Error ? error.message : String(error),
      });
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to products
      </Link>
      <header className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Add New Plant</h1>
        <p className="mt-2 leading-7 text-[var(--muted)]">
          Create a secure catalog record, add care information, and publish it when ready.
        </p>
      </header>

      {!available ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          <p>Categories are temporarily unavailable. Try again after the database connection is restored.</p>
        </div>
      ) : categories.length ? (
        <ProductCreateForm categories={categories} />
      ) : (
        <div className="surface mt-8 p-6 text-center sm:p-10">
          <AlertTriangle className="mx-auto text-amber-700" size={28} aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">Create an active category first</h2>
          <p className="mt-2 text-[var(--muted)]">Every product must belong to an active category.</p>
          <Link
            href="/admin/categories"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 font-semibold text-white"
          >
            Manage Categories
          </Link>
        </div>
      )}
    </div>
  );
}
