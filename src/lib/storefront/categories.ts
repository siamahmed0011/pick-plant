import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/types";

export type StorefrontCategory = Category & {
  productCount: number;
};

const placeholderImage = "/images/placeholders/category.svg";

export const getStorefrontCategories = cache(async (): Promise<StorefrontCategory[]> => {
  try {
    const records = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        bengaliName: true,
        slug: true,
        description: true,
        imageUrl: true,
        isActive: true,
        _count: {
          select: {
            products: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      bengaliName: record.bengaliName ?? record.name,
      slug: record.slug,
      description: record.description ?? "",
      image: record.imageUrl ?? placeholderImage,
      active: record.isActive,
      productCount: record._count.products,
    }));
  } catch (error) {
    console.error("Failed to load storefront categories from database:", error);
    return [];
  }
});
