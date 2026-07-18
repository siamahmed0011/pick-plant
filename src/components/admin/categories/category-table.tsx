"use client";

import { FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/formatters";
import type { AdminCategory } from "@/types/admin-category";
import { CategoryDeleteDialog } from "./category-delete-dialog";
import { CategoryDialog } from "./category-dialog";

function CategoryActions({ category }: { category: AdminCategory }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <CategoryDialog category={category} />
      <CategoryDeleteDialog category={category} />
    </div>
  );
}

export function CategoryTable({ categories }: { categories: AdminCategory[] }) {
  if (!categories.length) {
    return (
      <Card className="mt-8 grid min-h-72 place-items-center p-6 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--muted-surface)] text-[var(--primary)]">
            <FolderTree size={25} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-bold">No categories found</h2>
          <p className="mt-2 text-[var(--muted)]">Create the first category for your product catalog.</p>
          <div className="mt-6">
            <CategoryDialog />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="category-list-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="category-list-title" className="text-xl font-bold">Category list</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatNumber(categories.length)} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>
      </div>
      <div className="surface hidden overflow-hidden lg:block">
        <Table className="table-fixed text-sm">
          <thead className="bg-[var(--muted-surface)] text-[var(--primary)]">
            <tr>
              <th className="w-[15%] px-4 py-3 font-bold">Name</th>
              <th className="w-[14%] px-4 py-3 font-bold">Slug</th>
              <th className="w-[20%] px-4 py-3 font-bold">Description</th>
              <th className="w-[10%] px-4 py-3 font-bold">Status</th>
              <th className="w-[8%] px-4 py-3 font-bold">Products</th>
              <th className="w-[14%] px-4 py-3 font-bold">Created</th>
              <th className="w-[19%] px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-4 font-bold">{category.name}</td>
                <td className="truncate px-4 py-4 font-mono text-xs text-[var(--muted)]">{category.slug}</td>
                <td className="px-4 py-4 text-[var(--muted)]">
                  <span className="line-clamp-2">{category.description ?? "—"}</span>
                </td>
                <td className="px-4 py-4">
                  <Badge className={category.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-4">{formatNumber(category.productCount)}</td>
                <td className="px-4 py-4 text-[var(--muted)]">{formatDate(category.createdAt)}</td>
                <td className="px-4 py-4"><CategoryActions category={category} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="grid gap-4 lg:hidden">
        {categories.map((category) => (
          <Card className="p-5" key={category.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold">{category.name}</h3>
                <p className="truncate font-mono text-xs text-[var(--muted)]">{category.slug}</p>
              </div>
              <Badge className={category.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                {category.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {category.description && <p className="mt-4 line-clamp-3 text-sm text-[var(--muted)]">{category.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-3 border-y py-4 text-sm">
              <div><dt className="text-[var(--muted)]">Products</dt><dd className="font-bold">{formatNumber(category.productCount)}</dd></div>
              <div><dt className="text-[var(--muted)]">Created</dt><dd className="font-bold">{formatDate(category.createdAt)}</dd></div>
            </dl>
            <div className="mt-4"><CategoryActions category={category} /></div>
          </Card>
        ))}
      </div>
    </section>
  );
}
