import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { InventoryMovementType, ProductStatus } from "@/generated/prisma/enums";
import { productCardImageUrl } from "@/lib/cloudinary-image";
import { prisma } from "@/lib/prisma";
import type { InventoryListItem, InventoryMovementItem, InventoryStockStatus } from "@/types/admin-inventory";

export const INVENTORY_PAGE_SIZE = 20;
export const INVENTORY_HISTORY_PAGE_SIZE = 25;

const inventorySortValues = ["name", "stock-asc", "stock-desc", "recent", "oldest", "low-stock"] as const;
type InventorySort = (typeof inventorySortValues)[number];
type RawSearchParams = Record<string, string | string[] | undefined>;

export type InventoryFilters = {
  search: string;
  category: string;
  stock: "" | InventoryStockStatus;
  catalog: "" | "ACTIVE" | "DRAFT" | "FEATURED";
  sort: InventorySort;
  page: number;
};

export type InventoryHistoryFilters = {
  product: string;
  type: "" | InventoryMovementType;
  actor: string;
  direction: "" | "POSITIVE" | "NEGATIVE";
  dateFrom: string;
  dateTo: string;
  page: number;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function pageValue(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function dateValue(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function getInventoryStockStatus(stock: number, threshold: number | null): InventoryStockStatus {
  if (stock === 0) return "OUT_OF_STOCK";
  if (threshold !== null && stock <= threshold) return "LOW_STOCK";
  return "IN_STOCK";
}

export function parseInventoryFilters(params: RawSearchParams): InventoryFilters {
  const category = firstValue(params.category)?.trim() ?? "";
  const stock = firstValue(params.stock) ?? "";
  const catalog = firstValue(params.catalog)?.toUpperCase() ?? "";
  const sort = firstValue(params.sort) ?? "recent";
  return {
    search: (firstValue(params.search)?.trim() ?? "").slice(0, 100),
    category: isUuid(category) ? category : "",
    stock: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(stock)
      ? (stock as InventoryFilters["stock"])
      : "",
    catalog: ["ACTIVE", "DRAFT", "FEATURED"].includes(catalog)
      ? (catalog as InventoryFilters["catalog"])
      : "",
    sort: inventorySortValues.includes(sort as InventorySort) ? (sort as InventorySort) : "recent",
    page: pageValue(firstValue(params.page)),
  };
}

export function inventoryFiltersToSearchParams(filters: InventoryFilters) {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.stock ? { stock: filters.stock } : {}),
    ...(filters.catalog ? { catalog: filters.catalog } : {}),
    ...(filters.sort !== "recent" ? { sort: filters.sort } : {}),
  };
}

export function parseInventoryHistoryFilters(params: RawSearchParams): InventoryHistoryFilters {
  const product = firstValue(params.product)?.trim() ?? "";
  const actor = firstValue(params.actor)?.trim() ?? "";
  const type = firstValue(params.type)?.toUpperCase() ?? "";
  const direction = firstValue(params.direction)?.toUpperCase() ?? "";
  return {
    product: isUuid(product) ? product : "",
    actor: isUuid(actor) ? actor : "",
    type: Object.values(InventoryMovementType).includes(type as InventoryMovementType)
      ? (type as InventoryMovementType)
      : "",
    direction: direction === "POSITIVE" || direction === "NEGATIVE" ? direction : "",
    dateFrom: dateValue(firstValue(params.dateFrom)),
    dateTo: dateValue(firstValue(params.dateTo)),
    page: pageValue(firstValue(params.page)),
  };
}

export function inventoryHistoryFiltersToSearchParams(filters: InventoryHistoryFilters) {
  return {
    ...(filters.product ? { product: filters.product } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.actor ? { actor: filters.actor } : {}),
    ...(filters.direction ? { direction: filters.direction } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
  };
}

function stockWhere(stock: InventoryFilters["stock"]): Prisma.ProductWhereInput {
  if (stock === "OUT_OF_STOCK") return { stockQuantity: 0 };
  if (stock === "LOW_STOCK") {
    return {
      stockQuantity: { gt: 0, lte: prisma.product.fields.lowStockThreshold },
      lowStockThreshold: { not: null },
    };
  }
  if (stock === "IN_STOCK") {
    return {
      stockQuantity: { gt: 0 },
      OR: [
        { lowStockThreshold: null },
        { stockQuantity: { gt: prisma.product.fields.lowStockThreshold } },
      ],
    };
  }
  return {};
}

function inventoryOrderBy(sort: InventorySort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: "asc" }, { id: "asc" }];
    case "stock-asc":
    case "low-stock":
      return [{ stockQuantity: "asc" }, { name: "asc" }];
    case "stock-desc":
      return [{ stockQuantity: "desc" }, { name: "asc" }];
    case "oldest":
      return [{ updatedAt: "asc" }, { id: "asc" }];
    default:
      return [{ updatedAt: "desc" }, { id: "desc" }];
  }
}

export async function getInventoryDashboard(filters: InventoryFilters) {
  const where: Prisma.ProductWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { sku: { contains: filters.search, mode: "insensitive" as const } },
            { slug: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.category ? { categoryId: filters.category } : {}),
    ...(filters.catalog === "ACTIVE" || filters.catalog === "DRAFT"
      ? { status: filters.catalog as ProductStatus }
      : {}),
    ...(filters.catalog === "FEATURED" ? { isFeatured: true } : {}),
    ...stockWhere(filters.stock),
  };
  const lowStockWhere: Prisma.ProductWhereInput = {
    stockQuantity: { gt: 0, lte: prisma.product.fields.lowStockThreshold },
    lowStockThreshold: { not: null },
  };
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalItems, categories, totalProducts, stockAggregate, lowStockProducts, outOfStockProducts, movementsToday] =
    await Promise.all([
      prisma.product.count({ where }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.product.count(),
      prisma.product.aggregate({ _sum: { stockQuantity: true } }),
      prisma.product.count({ where: lowStockWhere }),
      prisma.product.count({ where: { stockQuantity: 0 } }),
      prisma.inventoryMovement.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / INVENTORY_PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const records = await prisma.product.findMany({
    where,
    orderBy: inventoryOrderBy(filters.sort),
    skip: (currentPage - 1) * INVENTORY_PAGE_SIZE,
    take: INVENTORY_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      stockQuantity: true,
      lowStockThreshold: true,
      status: true,
      isFeatured: true,
      updatedAt: true,
      category: { select: { name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 1,
        select: { url: true, publicId: true, secureUrl: true, altText: true },
      },
      inventoryMovements: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  const items: InventoryListItem[] = records.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
    isFeatured: product.isFeatured,
    updatedAt: product.updatedAt,
    lastInventoryUpdate: product.inventoryMovements[0]?.createdAt ?? null,
    imageUrl: product.images[0]
      ? productCardImageUrl(product.images[0].publicId, product.images[0].secureUrl ?? product.images[0].url)
      : null,
    imageAlt: product.images[0]?.altText ?? null,
  }));

  return {
    items,
    categories,
    totalItems,
    totalPages,
    currentPage,
    summary: {
      totalProducts,
      totalUnits: stockAggregate._sum.stockQuantity ?? 0,
      lowStockProducts,
      outOfStockProducts,
      movementsToday,
    },
  };
}

function historyDateRange(filters: InventoryHistoryFilters) {
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.dateFrom) createdAt.gte = new Date(`${filters.dateFrom}T00:00:00`);
  if (filters.dateTo) createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999`);
  return Object.keys(createdAt).length ? createdAt : undefined;
}

export async function getInventoryHistory(filters: InventoryHistoryFilters) {
  const where: Prisma.InventoryMovementWhereInput = {
    ...(filters.product ? { productId: filters.product } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.actor ? { performedById: filters.actor } : {}),
    ...(filters.direction === "POSITIVE" ? { quantity: { gt: 0 } } : {}),
    ...(filters.direction === "NEGATIVE" ? { quantity: { lt: 0 } } : {}),
    ...(historyDateRange(filters) ? { createdAt: historyDateRange(filters) } : {}),
  };
  const [totalItems, products, actors] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
    prisma.inventoryMovement.findMany({
      where: { performedById: { not: null } },
      distinct: ["performedById"],
      orderBy: { performedById: "asc" },
      select: { performedById: true, performedByName: true, performedByEmail: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / INVENTORY_HISTORY_PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const movements: InventoryMovementItem[] = await prisma.inventoryMovement.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * INVENTORY_HISTORY_PAGE_SIZE,
    take: INVENTORY_HISTORY_PAGE_SIZE,
    select: {
      id: true,
      productId: true,
      productName: true,
      productSku: true,
      type: true,
      quantity: true,
      previousStock: true,
      newStock: true,
      reason: true,
      note: true,
      reference: true,
      performedByName: true,
      performedByEmail: true,
      createdAt: true,
    },
  });
  return { movements, products, actors, totalItems, totalPages, currentPage };
}

export async function getInventoryProductDetail(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      stockQuantity: true,
      lowStockThreshold: true,
      status: true,
      updatedAt: true,
      category: { select: { name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 1,
        select: { url: true, publicId: true, secureUrl: true, altText: true },
      },
      inventoryMovements: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
        select: {
          id: true,
          productId: true,
          productName: true,
          productSku: true,
          type: true,
          quantity: true,
          previousStock: true,
          newStock: true,
          reason: true,
          note: true,
          reference: true,
          performedByName: true,
          performedByEmail: true,
          createdAt: true,
        },
      },
    },
  });
}
