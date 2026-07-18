"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { deleteCategoryAction } from "@/app/admin/categories/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  initialCategoryActionState,
  type AdminCategory,
  type CategoryActionState,
} from "@/types/admin-category";

function DeleteCategoryForm({
  category,
  onSuccess,
}: {
  category: AdminCategory;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState<CategoryActionState, FormData>(
    deleteCategoryAction,
    initialCategoryActionState,
  );
  const blocked = category.productCount > 0;

  useEffect(() => {
    if (state.status === "success") onSuccess();
  }, [onSuccess, state.status]);

  return (
    <form action={formAction}>
      <input type="hidden" name="categoryId" value={category.id} />
      <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-950">
        <TriangleAlert className="mt-0.5 shrink-0 text-[var(--danger)]" size={20} aria-hidden="true" />
        <div>
          <p className="font-bold">Delete “{category.name}”?</p>
          <p className="mt-1 text-sm leading-6">
            {blocked
              ? `This category contains ${category.productCount} product${category.productCount === 1 ? "" : "s"} and cannot be deleted.`
              : "This action is permanent and cannot be undone."}
          </p>
        </div>
      </div>
      {state.status === "error" && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]" role="alert">
          {state.message}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="danger" disabled={blocked || pending}>
          {pending && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
          {pending ? "Deleting…" : "Delete category"}
        </Button>
      </div>
    </form>
  );
}

export function CategoryDeleteDialog({ category }: { category: AdminCategory }) {
  const [open, setOpen] = useState(false);
  const closeDialog = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${category.name}`}
        className="text-[var(--danger)]"
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete
      </Button>
      <Modal open={open} title="Confirm category deletion" onClose={closeDialog}>
        <DeleteCategoryForm category={category} onSuccess={closeDialog} />
      </Modal>
    </>
  );
}
