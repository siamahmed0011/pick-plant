"use server";

import { revalidatePath } from "next/cache";
import {
  InventoryConflictError,
  InventoryNegativeStockError,
  InventoryNotFoundError,
  adjustInventoryStock,
  bulkUpdateInventory,
  updateInventoryThreshold,
} from "@/lib/admin/inventory";
import {
  bulkInventorySchema,
  stockAdjustmentSchema,
  thresholdUpdateSchema,
} from "@/lib/admin/inventory-validation";
import { requireAdmin } from "@/lib/auth/guards";
import type { InventoryActionState, InventoryListItem } from "@/types/admin-inventory";

function failure(
  message: string,
  fieldErrors?: InventoryActionState["fieldErrors"],
): InventoryActionState {
  return { status: "error", message, fieldErrors };
}

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

function actorFromSession(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

function revalidateInventoryProduct(product: Pick<InventoryListItem, "id" | "slug" | "categorySlug">) {
  revalidatePath("/");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${product.id}`);
  revalidatePath("/admin/inventory/history");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}/edit`);
  revalidatePath("/plants");
  revalidatePath(`/plants/${product.slug}`);
  revalidatePath(`/categories/${product.categorySlug}`);
}

function inventoryError(error: unknown) {
  if (error instanceof InventoryNotFoundError) return failure(error.message);
  if (error instanceof InventoryNegativeStockError) {
    return failure(error.message, { quantity: [error.message] });
  }
  if (error instanceof InventoryConflictError || errorCode(error) === "P2034") {
    return failure(
      error instanceof InventoryConflictError
        ? error.message
        : "Stock changed while you were editing. Please review the latest value and try again.",
    );
  }
  console.error("Inventory update failed.", {
    name: error instanceof Error ? error.name : "UnknownError",
    code: errorCode(error),
  });
  return failure("Inventory could not be updated. Please try again.");
}

export async function adjustStockAction(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const session = await requireAdmin("/admin/inventory");
  const parsed = stockAdjustmentSchema.safeParse({
    productId: formData.get("productId"),
    expectedStock: formData.get("expectedStock"),
    mode: formData.get("mode"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
    note: formData.get("note") ?? "",
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success) {
    return failure("Review the stock adjustment and try again.", parsed.error.flatten().fieldErrors);
  }

  try {
    const result = await adjustInventoryStock(parsed.data, actorFromSession(session));
    revalidateInventoryProduct({
      id: result.id,
      slug: result.slug,
      categorySlug: result.category.slug,
    });
    const message =
      parsed.data.mode === "SET_EXACT"
        ? `Stock set to ${result.newStock}.`
        : `${Math.abs(result.difference)} unit${Math.abs(result.difference) === 1 ? "" : "s"} ${result.difference > 0 ? "added to" : "removed from"} ${result.name}.`;
    return { status: "success", message };
  } catch (error) {
    return inventoryError(error);
  }
}

export async function updateLowStockThresholdAction(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  await requireAdmin("/admin/inventory");
  const parsed = thresholdUpdateSchema.safeParse({
    productId: formData.get("productId"),
    expectedThreshold: formData.get("expectedThreshold") ?? "",
    threshold: formData.get("threshold"),
  });
  if (!parsed.success) {
    return failure("Review the low-stock threshold and try again.", parsed.error.flatten().fieldErrors);
  }

  try {
    const result = await updateInventoryThreshold({
      ...parsed.data,
      expectedThreshold: parsed.data.expectedThreshold === "" ? null : parsed.data.expectedThreshold,
    });
    revalidateInventoryProduct({
      id: result.id,
      slug: result.slug,
      categorySlug: result.category.slug,
    });
    return { status: "success", message: "Low-stock threshold updated." };
  } catch (error) {
    return inventoryError(error);
  }
}

export async function bulkAdjustStockAction(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const session = await requireAdmin("/admin/inventory");
  let entries: unknown = [];
  try {
    entries = JSON.parse(String(formData.get("entries") ?? "[]"));
  } catch {
    return failure("The selected products are invalid.", { entries: ["Select the products again."] });
  }
  const parsed = bulkInventorySchema.safeParse({
    mode: formData.get("mode"),
    entries,
    quantity: formData.get("quantity"),
    reason: formData.get("reason") ?? "",
    note: formData.get("note") ?? "",
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success) {
    return failure("Review the bulk inventory update and try again.", parsed.error.flatten().fieldErrors);
  }

  try {
    const results = await bulkUpdateInventory(
      { ...parsed.data, reason: parsed.data.reason || undefined },
      actorFromSession(session),
    );
    for (const product of results) {
      revalidateInventoryProduct({
        id: product.id,
        slug: product.slug,
        categorySlug: product.category.slug,
      });
    }
    return {
      status: "success",
      message:
        parsed.data.mode === "SET_THRESHOLD"
          ? `Low-stock threshold updated for ${results.length} products.`
          : `Inventory updated for ${results.length} products.`,
    };
  } catch (error) {
    return inventoryError(error);
  }
}
