import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { InventoryMovementType } from "@/generated/prisma/enums";
import { inventoryReasonDetails } from "@/lib/admin/inventory-validation";
import { prisma } from "@/lib/prisma";
import type { BulkInventoryMode, InventoryReason, StockAdjustmentMode } from "@/types/admin-inventory";

export type InventoryActor = {
  id: string;
  email: string | null;
  name: string | null;
};

export class InventoryNotFoundError extends Error {}
export class InventoryConflictError extends Error {}
export class InventoryNegativeStockError extends Error {}

const productSelect = {
  id: true,
  name: true,
  sku: true,
  slug: true,
  stockQuantity: true,
  lowStockThreshold: true,
  category: { select: { slug: true } },
} satisfies Prisma.ProductSelect;

type SelectedProduct = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

function calculateNewStock(currentStock: number, mode: StockAdjustmentMode, quantity: number) {
  const newStock =
    mode === "INCREASE"
      ? currentStock + quantity
      : mode === "DECREASE"
        ? currentStock - quantity
        : quantity;
  if (newStock < 0) throw new InventoryNegativeStockError("Stock cannot be below zero.");
  if (newStock > 2_147_483_647) throw new InventoryNegativeStockError("Stock value is too large.");
  return newStock;
}

function movementData(
  product: SelectedProduct,
  actor: InventoryActor,
  input: { type: InventoryMovementType; reason: string; note: string; reference: string },
  newStock: number,
): Prisma.InventoryMovementCreateInput {
  return {
    product: { connect: { id: product.id } },
    performedBy: { connect: { id: actor.id } },
    type: input.type,
    quantity: newStock - product.stockQuantity,
    previousStock: product.stockQuantity,
    newStock,
    reason: input.reason,
    note: input.note || null,
    reference: input.reference || null,
    productName: product.name,
    productSku: product.sku,
    performedByEmail: actor.email,
    performedByName: actor.name,
  };
}

async function updateProductStock(
  transaction: Prisma.TransactionClient,
  product: SelectedProduct,
  newStock: number,
) {
  const updated = await transaction.product.updateMany({
    where: { id: product.id, stockQuantity: product.stockQuantity },
    data: { stockQuantity: newStock },
  });
  if (updated.count !== 1) {
    throw new InventoryConflictError("Stock changed while you were editing.");
  }
}

export async function adjustInventoryStock(
  input: {
    productId: string;
    expectedStock: number;
    mode: StockAdjustmentMode;
    quantity: number;
    reason: InventoryReason;
    note: string;
    reference: string;
  },
  actor: InventoryActor,
) {
  return prisma.$transaction(
    async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: input.productId },
        select: productSelect,
      });
      if (!product) throw new InventoryNotFoundError("Product was not found.");
      if (product.stockQuantity !== input.expectedStock) {
        throw new InventoryConflictError("Stock changed while you were editing.");
      }

      const newStock = calculateNewStock(product.stockQuantity, input.mode, input.quantity);
      const difference = newStock - product.stockQuantity;
      if (difference === 0) {
        throw new InventoryConflictError("The exact stock value is already current.");
      }
      const reason = inventoryReasonDetails(input.reason);
      await updateProductStock(transaction, product, newStock);
      await transaction.inventoryMovement.create({
        data: movementData(
          product,
          actor,
          { type: reason.type, reason: reason.label, note: input.note, reference: input.reference },
          newStock,
        ),
      });

      return { ...product, previousStock: product.stockQuantity, newStock, difference };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function updateInventoryThreshold(
  input: { productId: string; expectedThreshold: number | null; threshold: number },
) {
  return prisma.$transaction(
    async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: input.productId },
        select: productSelect,
      });
      if (!product) throw new InventoryNotFoundError("Product was not found.");
      if (product.lowStockThreshold !== input.expectedThreshold) {
        throw new InventoryConflictError("The threshold changed while you were editing.");
      }
      await transaction.product.update({
        where: { id: product.id },
        data: { lowStockThreshold: input.threshold },
      });
      return { ...product, lowStockThreshold: input.threshold };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function bulkUpdateInventory(
  input: {
    mode: BulkInventoryMode;
    entries: Array<{ productId: string; expectedStock: number; value?: number }>;
    quantity: number;
    reason?: InventoryReason;
    note: string;
    reference: string;
  },
  actor: InventoryActor,
) {
  return prisma.$transaction(
    async (transaction) => {
      const products = await transaction.product.findMany({
        where: { id: { in: input.entries.map((entry) => entry.productId) } },
        select: productSelect,
      });
      if (products.length !== input.entries.length) {
        throw new InventoryNotFoundError("One or more products were not found.");
      }
      const byId = new Map(products.map((product) => [product.id, product]));
      const results: Array<SelectedProduct & { previousStock: number; newStock: number; difference: number }> = [];

      for (const entry of input.entries) {
        const product = byId.get(entry.productId);
        if (!product) throw new InventoryNotFoundError("One or more products were not found.");
        if (product.stockQuantity !== entry.expectedStock) {
          throw new InventoryConflictError("Stock changed while you were editing.");
        }

        if (input.mode === "SET_THRESHOLD") {
          await transaction.product.update({
            where: { id: product.id },
            data: { lowStockThreshold: input.quantity },
          });
          results.push({ ...product, lowStockThreshold: input.quantity, previousStock: product.stockQuantity, newStock: product.stockQuantity, difference: 0 });
          continue;
        }

        const quantity = input.mode === "SET_EXACT" ? entry.value : input.quantity;
        if (quantity === undefined) throw new InventoryConflictError("An exact stock value is missing.");
        const newStock = calculateNewStock(product.stockQuantity, input.mode, quantity);
        const difference = newStock - product.stockQuantity;
        if (difference === 0) throw new InventoryConflictError(`${product.name} already has that stock value.`);
        if (!input.reason) throw new InventoryConflictError("A stock movement reason is required.");
        const reason = inventoryReasonDetails(input.reason);
        await updateProductStock(transaction, product, newStock);
        await transaction.inventoryMovement.create({
          data: movementData(
            product,
            actor,
            { type: reason.type, reason: reason.label, note: input.note, reference: input.reference },
            newStock,
          ),
        });
        results.push({ ...product, previousStock: product.stockQuantity, newStock, difference });
      }

      return results;
    },
    { isolationLevel: "Serializable" },
  );
}

export async function recordInitialInventoryMovement(
  transaction: Prisma.TransactionClient,
  product: { id: string; name: string; sku: string; stockQuantity: number },
  actor: InventoryActor,
) {
  if (product.stockQuantity <= 0) return;
  await transaction.inventoryMovement.create({
    data: {
      product: { connect: { id: product.id } },
      performedBy: { connect: { id: actor.id } },
      type: InventoryMovementType.INITIAL,
      quantity: product.stockQuantity,
      previousStock: 0,
      newStock: product.stockQuantity,
      reason: "Initial product stock",
      productName: product.name,
      productSku: product.sku,
      performedByEmail: actor.email,
      performedByName: actor.name,
    },
  });
}
