import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ProductStatus, type ProductStatus as ProductStatusValue } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { productCardImageUrl } from "@/lib/cloudinary-image";

export const PRODUCT_PAGE_SIZE = 10;

export const productSortValues = ["newest", "oldest", "name", "stock", "price"] as const;
export type ProductSort = (typeof productSortValues)[number];
export type FeaturedFilter = "" | "true" | "false";

export type AdminProductFilters = {
  search: string;
  category: string;
  status: "" | ProductStatusValue;
  featured: FeaturedFilter;
  sort: ProductSort;
  page: number;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number | null;
  status: ProductStatusValue;
  isFeatured: boolean;
  createdAt: Date;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type AdminProductListing = {
  available: boolean;
  items: AdminProductListItem[];
  categories: Array<{ id: string; name: string }>;
  totalItems: number;
  totalPages: number;
  currentPage: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseAdminProductFilters(params: RawSearchParams): AdminProductFilters {
  const rawSearch = firstValue(params.search)?.trim() ?? "";
  const rawCategory = firstValue(params.category)?.trim() ?? "";
  const rawStatus = firstValue(params.status)?.toUpperCase() ?? "";
  const rawFeatured = firstValue(params.featured) ?? "";
  const rawSort = firstValue(params.sort) ?? "newest";
  const rawPage = Number.parseInt(firstValue(params.page) ?? "1", 10);
  const statusValues = Object.values(ProductStatus) as string[];

  return {
    search: rawSearch.slice(0, 100),
    category: isUuid(rawCategory) ? rawCategory : "",
    status: statusValues.includes(rawStatus) ? (rawStatus as ProductStatusValue) : "",
    featured: rawFeatured === "true" || rawFeatured === "false" ? rawFeatured : "",
    sort: productSortValues.includes(rawSort as ProductSort) ? (rawSort as ProductSort) : "newest",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function productFiltersToSearchParams(filters: AdminProductFilters) {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.featured ? { featured: filters.featured } : {}),
    ...(filters.sort !== "newest" ? { sort: filters.sort } : {}),
  };
}

function getProductOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "name":
      return [{ name: "asc" }, { id: "asc" }];
    case "stock":
      return [{ stockQuantity: "asc" }, { name: "asc" }];
    case "price":
      return [{ price: "asc" }, { name: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export async function getAdminProductListing(
  filters: AdminProductFilters,
): Promise<AdminProductListing> {
  const where: Prisma.ProductWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
            { category: { name: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.category ? { categoryId: filters.category } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.featured ? { isFeatured: filters.featured === "true" } : {}),
  };

  try {
    const [totalItems, categories] = await Promise.all([
      prisma.product.count({ where }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / PRODUCT_PAGE_SIZE));
    const currentPage = Math.min(filters.page, totalPages);
    const records = await prisma.product.findMany({
      where,
      orderBy: getProductOrderBy(filters.sort),
      skip: (currentPage - 1) * PRODUCT_PAGE_SIZE,
      take: PRODUCT_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stockQuantity: true,
        lowStockThreshold: true,
        status: true,
        isFeatured: true,
        createdAt: true,
        category: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
          select: { url: true, publicId: true, secureUrl: true, altText: true },
        },
      },
    });

    return {
      available: true,
      items: records.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        categoryName: product.category.name,
        price: Number(product.price),
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        status: product.status,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt,
        imageUrl: product.images[0]
          ? productCardImageUrl(product.images[0].publicId, product.images[0].secureUrl ?? product.images[0].url)
          : null,
        imageAlt: product.images[0]?.altText ?? null,
      })),
      categories,
      totalItems,
      totalPages,
      currentPage,
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    console.error("Admin products could not be loaded.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      available: false,
      items: [],
      categories: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
}
