import { z } from "zod";
import { InventoryMovementType } from "@/generated/prisma/enums";

export const stockAdjustmentModes = ["INCREASE", "DECREASE", "SET_EXACT"] as const;
export const bulkInventoryModes = [...stockAdjustmentModes, "SET_THRESHOLD"] as const;
export const inventoryReasonValues = [
  "NEW_STOCK_RECEIVED",
  "CUSTOMER_ORDER",
  "CUSTOMER_RETURN",
  "DAMAGED_INVENTORY",
  "MISSING_INVENTORY",
  "INVENTORY_RECOUNT",
  "MANUAL_CORRECTION",
  "OTHER",
] as const;

export const inventoryReasonOptions = [
  { value: "NEW_STOCK_RECEIVED", label: "New stock received" },
  { value: "CUSTOMER_ORDER", label: "Customer order" },
  { value: "CUSTOMER_RETURN", label: "Customer return" },
  { value: "DAMAGED_INVENTORY", label: "Damaged inventory" },
  { value: "MISSING_INVENTORY", label: "Missing inventory" },
  { value: "INVENTORY_RECOUNT", label: "Inventory recount" },
  { value: "MANUAL_CORRECTION", label: "Manual correction" },
  { value: "OTHER", label: "Other" },
] as const;

const productId = z.string().uuid("Select a valid product.");
const nonNegativeInteger = z
  .number({ error: "Enter a whole number." })
  .int("Enter a whole number.")
  .nonnegative("Stock cannot be below zero.")
  .max(2_147_483_647, "Stock value is too large.");

function integerText(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => /^\d+$/.test(value), "Enter a non-negative whole number.")
    .transform(Number)
    .pipe(nonNegativeInteger);
}

const reasonSchema = z.enum(inventoryReasonValues, { error: "Select a stock movement reason." });
const noteSchema = z.string().trim().max(500, "Note must be 500 characters or fewer.");
const referenceSchema = z
  .string()
  .trim()
  .max(160, "Reference must be 160 characters or fewer.");

function requireOtherNote(
  data: { reason?: (typeof inventoryReasonValues)[number]; note?: string },
  context: z.RefinementCtx,
) {
  if (data.reason === "OTHER" && !data.note) {
    context.addIssue({
      code: "custom",
      path: ["note"],
      message: "Add a note explaining the other reason.",
    });
  }
}

export const stockAdjustmentSchema = z
  .object({
    productId,
    expectedStock: integerText("Current stock is required."),
    mode: z.enum(stockAdjustmentModes, { error: "Select a stock adjustment mode." }),
    quantity: integerText("Quantity is required."),
    reason: reasonSchema,
    note: noteSchema,
    reference: referenceSchema,
  })
  .superRefine((data, context) => {
    if (data.mode !== "SET_EXACT" && data.quantity === 0) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Adjustment quantity must be greater than zero.",
      });
    }
    requireOtherNote(data, context);
  });

export const thresholdUpdateSchema = z.object({
  productId,
  expectedThreshold: z.union([integerText("Current threshold is required."), z.literal("")]),
  threshold: integerText("Low-stock threshold is required."),
});

const bulkEntrySchema = z.object({
  productId,
  expectedStock: nonNegativeInteger,
  value: nonNegativeInteger.optional(),
});

export const bulkInventorySchema = z
  .object({
    mode: z.enum(bulkInventoryModes, { error: "Select a bulk operation." }),
    entries: z.array(bulkEntrySchema).min(1, "Select at least one product.").max(50, "Select no more than 50 products."),
    quantity: integerText("Quantity is required."),
    reason: z.union([reasonSchema, z.literal("")]),
    note: noteSchema,
    reference: referenceSchema,
  })
  .superRefine((data, context) => {
    const ids = data.entries.map((entry) => entry.productId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", path: ["entries"], message: "Duplicate products are not allowed." });
    }
    if ((data.mode === "INCREASE" || data.mode === "DECREASE") && data.quantity === 0) {
      context.addIssue({ code: "custom", path: ["quantity"], message: "Adjustment quantity must be greater than zero." });
    }
    if (data.mode === "SET_EXACT" && data.entries.some((entry) => entry.value === undefined)) {
      context.addIssue({ code: "custom", path: ["entries"], message: "Enter an exact stock value for every selected product." });
    }
    if (data.mode !== "SET_THRESHOLD" && !data.reason) {
      context.addIssue({ code: "custom", path: ["reason"], message: "Select a stock movement reason." });
    }
    requireOtherNote({ reason: data.reason || undefined, note: data.note }, context);
  });

export const inventoryHistoryMovementTypes = Object.values(InventoryMovementType);

export function inventoryReasonDetails(reason: (typeof inventoryReasonValues)[number]) {
  switch (reason) {
    case "NEW_STOCK_RECEIVED":
      return { type: InventoryMovementType.RESTOCK, label: "New stock received" };
    case "CUSTOMER_ORDER":
      return { type: InventoryMovementType.SALE, label: "Customer order" };
    case "CUSTOMER_RETURN":
      return { type: InventoryMovementType.RETURN, label: "Customer return" };
    case "DAMAGED_INVENTORY":
      return { type: InventoryMovementType.DAMAGE, label: "Damaged inventory" };
    case "MISSING_INVENTORY":
      return { type: InventoryMovementType.LOSS, label: "Missing inventory" };
    case "INVENTORY_RECOUNT":
      return { type: InventoryMovementType.CORRECTION, label: "Inventory recount" };
    case "MANUAL_CORRECTION":
      return { type: InventoryMovementType.CORRECTION, label: "Manual correction" };
    default:
      return { type: InventoryMovementType.MANUAL_ADJUSTMENT, label: "Other" };
  }
}
