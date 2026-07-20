import type { InventoryMovementType, ProductStatus } from "@/generated/prisma/enums";

export type StockAdjustmentMode = "INCREASE" | "DECREASE" | "SET_EXACT";
export type BulkInventoryMode = StockAdjustmentMode | "SET_THRESHOLD";
export type InventoryReason =
  | "NEW_STOCK_RECEIVED"
  | "CUSTOMER_ORDER"
  | "CUSTOMER_RETURN"
  | "DAMAGED_INVENTORY"
  | "MISSING_INVENTORY"
  | "INVENTORY_RECOUNT"
  | "MANUAL_CORRECTION"
  | "OTHER";

export type InventoryActionField =
  | "productId"
  | "expectedStock"
  | "expectedThreshold"
  | "mode"
  | "quantity"
  | "reason"
  | "note"
  | "reference"
  | "threshold"
  | "entries";

export type InventoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<InventoryActionField, string[]>>;
};

export const initialInventoryActionState: InventoryActionState = { status: "idle" };

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  categorySlug: string;
  stockQuantity: number;
  lowStockThreshold: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  updatedAt: Date;
  lastInventoryUpdate: Date | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type InventoryMovementItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  type: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  note: string | null;
  reference: string | null;
  performedByName: string | null;
  performedByEmail: string | null;
  createdAt: Date;
};
