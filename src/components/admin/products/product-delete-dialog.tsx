"use client";

import { useActionState, useCallback, useState } from "react";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { deleteProductAction } from "@/app/admin/products/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  initialProductMutationState,
  type ProductMutationState,
} from "@/types/admin-product";

function DeleteProductForm({ product }: { product: { id: string; name: string } }) {
  const [state, formAction, pending] = useActionState<ProductMutationState, FormData>(
    deleteProductAction,
    initialProductMutationState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={product.id} />
      <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-950">
        <TriangleAlert className="mt-0.5 shrink-0 text-[var(--danger)]" size={20} aria-hidden="true" />
        <div>
          <p className="font-bold">Delete “{product.name}”?</p>
          <p className="mt-1 text-sm leading-6">
            This permanently removes the product and its images. This action cannot be undone.
          </p>
        </div>
      </div>
      {state.status === "error" && (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
          {pending ? "Deleting…" : "Delete product"}
        </Button>
      </div>
    </form>
  );
}

export function ProductDeleteDialog({ product }: { product: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);
  const closeDialog = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${product.name}`}
        title={`Delete ${product.name}`}
        className="text-[var(--danger)]"
      >
        <Trash2 size={16} aria-hidden="true" />
      </Button>
      <Modal open={open} title="Confirm product deletion" onClose={closeDialog}>
        <DeleteProductForm product={product} />
      </Modal>
    </>
  );
}
