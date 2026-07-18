"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Eye, EyeOff, LoaderCircle, Pencil, Star } from "lucide-react";
import {
  toggleProductFeaturedAction,
  toggleProductPublishingAction,
} from "@/app/admin/products/actions";
import { ProductDeleteDialog } from "@/components/admin/products/product-delete-dialog";
import { Button } from "@/components/ui/button";
import type { AdminProductListItem } from "@/lib/admin/product-listing";
import {
  initialProductMutationState,
  type ProductMutationState,
} from "@/types/admin-product";

function ActionMessage({ state }: { state: ProductMutationState }) {
  if (state.status === "idle") return null;
  return (
    <span
      className={state.status === "error" ? "block text-xs text-[var(--danger)]" : "sr-only"}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </span>
  );
}

export function ProductFeaturedToggle({ product }: { product: AdminProductListItem }) {
  const [state, formAction, pending] = useActionState<ProductMutationState, FormData>(
    toggleProductFeaturedAction,
    initialProductMutationState,
  );

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="featured" value={String(!product.isFeatured)} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`${product.isFeatured ? "Remove" : "Mark"} ${product.name} ${product.isFeatured ? "from" : "as"} featured`}
          aria-pressed={product.isFeatured}
          className={product.isFeatured ? "text-amber-700" : "text-[var(--muted)]"}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
          ) : (
            <Star size={16} fill={product.isFeatured ? "currentColor" : "none"} aria-hidden="true" />
          )}
          {pending ? "Updating…" : product.isFeatured ? "Featured" : "Standard"}
        </Button>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}

export function ProductPublishingToggle({ product }: { product: AdminProductListItem }) {
  const published = product.status === "ACTIVE";
  const [state, formAction, pending] = useActionState<ProductMutationState, FormData>(
    toggleProductPublishingAction,
    initialProductMutationState,
  );

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="status" value={published ? "DRAFT" : "ACTIVE"} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`${published ? "Move" : "Publish"} ${product.name}${published ? " to draft" : ""}`}
          aria-pressed={published}
          className={published ? "text-emerald-700" : "text-amber-800"}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
          ) : published ? (
            <Eye size={16} aria-hidden="true" />
          ) : (
            <EyeOff size={16} aria-hidden="true" />
          )}
          {pending ? "Updating…" : published ? "Published" : "Draft"}
        </Button>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}

export function ProductManagementActions({ product }: { product: AdminProductListItem }) {
  return (
    <div className="flex items-center justify-end gap-1" aria-label={`Actions for ${product.name}`}>
      <Link
        href={`/admin/products/${product.id}/edit`}
        aria-label={`Edit ${product.name}`}
        title={`Edit ${product.name}`}
        className="inline-flex size-11 items-center justify-center rounded-xl transition hover:bg-[var(--muted-surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Pencil size={16} aria-hidden="true" />
      </Link>
      <ProductDeleteDialog product={{ id: product.id, name: product.name }} />
    </div>
  );
}
