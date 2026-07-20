import "server-only";

import { cache } from "react";
import { products as staticProducts } from "@/data/products";
import { productCardImageUrl, productDetailImageUrl } from "@/lib/cloudinary-image";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types";

const placeholderImage = "/images/placeholders/plant.svg";

function productDifficulty(value: string | null): Product["difficulty"] {
  return value === "Medium" || value === "Hard" ? value : "Easy";
}

function growingLocation(value: string | null): Product["indoorOutdoor"] {
  return value === "Outdoor" || value === "Both" ? value : "Indoor";
}

export const getStorefrontProducts = cache(async (): Promise<Product[]> => {
  try {
    const records = await prisma.product.findMany({
      where: { status: "ACTIVE", category: { isActive: true } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
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

    const databaseProducts: Product[] = records.map((product) => {
      const currentPrice = Number(product.price);
      const regularPrice = product.compareAtPrice
        ? Number(product.compareAtPrice)
        : currentPrice;
      const galleryImages = product.images.map((image) =>
        productDetailImageUrl(image.publicId, image.secureUrl ?? image.url),
      );

      return {
        id: product.id,
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
          : placeholderImage,
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
        difficulty: productDifficulty(product.difficulty),
        petFriendly: false,
        featured: product.isFeatured,
        published: true,
        indoorOutdoor: growingLocation(product.indoorOutdoor),
        plantSize: product.plantSize ?? undefined,
      };
    });

    const databaseSlugs = new Set(databaseProducts.map((product) => product.slug));
    return [
      ...databaseProducts,
      ...staticProducts.filter((product) => !databaseSlugs.has(product.slug)),
    ];
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    const errorDetails = {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    };

    // Next.js opens its development error overlay for console.error calls,
    // even though this failure is handled by the static-product fallback.
    if (process.env.NODE_ENV === "development") {
      console.warn("Storefront products could not be loaded from the database.", errorDetails);
    } else {
      console.error("Storefront products could not be loaded from the database.", errorDetails);
    }
    return staticProducts;
  }
});
