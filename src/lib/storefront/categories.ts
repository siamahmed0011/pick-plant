import "server-only";

import { cache } from "react";
import { productCardImageUrl, productDetailImageUrl } from "@/lib/cloudinary-image";
import { prisma } from "@/lib/prisma";
import type { Category, Product } from "@/types";

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

export const getStorefrontCategoryBySlug = cache(
  async (slug: string): Promise<StorefrontCategory | null> => {
    try {
      const record = await prisma.category.findFirst({
        where: { slug, isActive: true },
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

      if (!record) return null;

      return {
        id: record.id,
        name: record.name,
        bengaliName: record.bengaliName ?? record.name,
        slug: record.slug,
        description: record.description ?? "",
        image: record.imageUrl ?? placeholderImage,
        active: record.isActive,
        productCount: record._count.products,
      };
    } catch (error) {
      console.error(`Failed to load category '${slug}' from database:`, error);
      return null;
    }
  }
);

export const getStorefrontCategoryProducts = cache(
  async (categoryId: string): Promise<Product[]> => {
    try {
      const records = await prisma.product.findMany({
        where: { categoryId, status: "ACTIVE" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          sku: true,
          name: true,
          bengaliName: true,
          slug: true,
          shortDescription: true,
          description: true,
          price: true,
          compareAtPrice: true,
          stockQuantity: true,
          isFeatured: true,
          plantSize: true,
          indoorOutdoor: true,
          difficulty: true,
          lightRequirement: true,
          waterRequirement: true,
          category: {
            select: {
              id: true,
              name: true,
              bengaliName: true,
              slug: true,
              description: true,
              imageUrl: true,
              isActive: true,
            },
          },
          images: {
            orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
            select: { url: true, publicId: true, secureUrl: true },
          },
        },
      });

      return records.map((product) => {
        const currentPrice = Number(product.price);
        const regularPrice = product.compareAtPrice
          ? Number(product.compareAtPrice)
          : currentPrice;
        const galleryImages = product.images.map((image) =>
          productDetailImageUrl(image.publicId, image.secureUrl ?? image.url),
        );

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          bengaliName: product.bengaliName ?? product.name,
          slug: product.slug,
          scientificName: product.name,
          shortDescription:
            product.shortDescription ??
            product.description?.slice(0, 300) ??
            `${product.name} from Pick Plant.`,
          regularPrice,
          salePrice: product.compareAtPrice ? currentPrice : undefined,
          stock: product.stockQuantity,
          image: product.images[0]
            ? productCardImageUrl(product.images[0].publicId, product.images[0].secureUrl ?? product.images[0].url)
            : "/images/placeholders/plant.svg",
          galleryImages: galleryImages.length ? galleryImages : undefined,
          category: {
            id: product.category.id,
            name: product.category.name,
            bengaliName: product.category.bengaliName ?? product.category.name,
            slug: product.category.slug,
            description: product.category.description ?? "",
            image: product.category.imageUrl ?? placeholderImage,
            active: product.category.isActive,
          },
          lightRequirement: product.lightRequirement ?? "Indirect light",
          wateringFrequency: product.waterRequirement ?? "Water as needed",
          difficulty:
            product.difficulty === "Medium" || product.difficulty === "Hard"
              ? product.difficulty
              : "Easy",
          petFriendly: false,
          featured: product.isFeatured,
          published: true,
          indoorOutdoor:
            product.indoorOutdoor === "Outdoor" || product.indoorOutdoor === "Both"
              ? product.indoorOutdoor
              : "Indoor",
          plantSize: product.plantSize ?? undefined,
        };
      });
    } catch (error) {
      console.error("Storefront category products could not be loaded from database:", error);
      return [];
    }
  }
);

