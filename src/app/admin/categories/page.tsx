import { AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryDialog } from "@/components/admin/categories/category-dialog";
import { CategoryTable } from "@/components/admin/categories/category-table";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { AdminCategory } from "@/types/admin-category";

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");
  let categories: AdminCategory[] = [];
  let available = true;

  try {
    const records = await prisma.category.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });
    categories = records.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      productCount: category._count.products,
    }));
  } catch (error) {
    available = false;
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    console.error("Admin categories could not be loaded.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <AdminPageHeader
          title="Categories"
          description="Create and organize the categories used by your product catalog."
          status={null}
        />
        <div className="shrink-0"><CategoryDialog /></div>
      </div>
      {!available ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          <p>Categories are temporarily unavailable. Try again after the database connection is restored.</p>
        </div>
      ) : (
        <CategoryTable categories={categories} />
      )}
    </div>
  );
}
