"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  productFormData,
  productFormSchema,
  productIdSchema,
} from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { destroyCloudinaryImage } from "@/lib/cloudinary";
import { normalizeProductImages } from "@/lib/admin/product-images";
import type { ProductActionState, ProductFormField } from "@/types/admin-product";

function failure(
  message: string,
  fieldErrors?: Partial<Record<ProductFormField, string[]>>,
): ProductActionState {
  return { status: "error", message, fieldErrors };
}

function databaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

export async function updateProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin("/admin/products");
  const productId = productIdSchema.safeParse(formData.get("productId"));
  const parsed = productFormSchema.safeParse(productFormData(formData));

  if (!productId.success || !parsed.success) {
    return failure("Review the highlighted product details and try again.", {
      ...(!parsed.success ? parsed.error.flatten().fieldErrors : {}),
      ...(!productId.success
        ? { name: [productId.error.issues[0]?.message ?? "Invalid product."] }
        : {}),
    });
  }

  const input = parsed.data;
  let paths:
    | { oldSlug: string; oldCategorySlug: string; newCategorySlug: string; removedPublicIds: string[] }
    | undefined;

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.product.findUnique({
          where: { id: productId.data },
          select: {
            id: true,
            slug: true,
            categoryId: true,
            category: { select: { slug: true } },
            images: {
              select: {
                id: true,
                url: true,
                publicId: true,
                secureUrl: true,
                width: true,
                height: true,
                format: true,
                bytes: true,
                altText: true,
              },
            },
          },
        });
        if (!existing) return { missing: true as const };

        const [selectedCategory, slugConflict] = await Promise.all([
          transaction.category.findUnique({
            where: { id: input.categoryId },
            select: { id: true, slug: true, isActive: true },
          }),
          transaction.product.findFirst({
            where: { id: { not: productId.data }, slug: input.slug },
            select: { id: true },
          }),
        ]);

        if (
          !selectedCategory ||
          (!selectedCategory.isActive && selectedCategory.id !== existing.categoryId)
        ) {
          return { categoryMissing: true as const };
        }
        if (slugConflict) return { slugConflict: true as const };

        const normalizedImages = normalizeProductImages({
          drafts: input.imageMetadata,
          existing: existing.images,
          productId: productId.data,
          creating: false,
        });
        if ("error" in normalizedImages) return { imageError: normalizedImages.error };

        await transaction.productImage.deleteMany({
          where: { productId: productId.data },
        });
        await transaction.product.update({
          where: { id: productId.data },
          data: {
            categoryId: input.categoryId,
            name: input.name,
            slug: input.slug,
            shortDescription: input.shortDescription,
            description: input.description,
            price: input.salePrice ?? input.regularPrice,
            compareAtPrice: input.salePrice === null ? null : input.regularPrice,
            stockQuantity: input.stockQuantity,
            lowStockThreshold: input.lowStockThreshold,
            status: input.status,
            isFeatured: input.isFeatured,
            plantSize: input.plantSize,
            indoorOutdoor: input.indoorOutdoor,
            difficulty: input.difficulty,
            lightRequirement: input.lightRequirement,
            waterRequirement: input.waterRequirement,
            seoTitle: input.seoTitle,
            seoDescription: input.seoDescription,
            images: normalizedImages.images.length
              ? {
                  create: normalizedImages.images.map((image) => ({
                    url: image.url,
                    publicId: image.publicId,
                    secureUrl: image.secureUrl,
                    width: image.width,
                    height: image.height,
                    format: image.format,
                    bytes: image.bytes,
                    altText: image.altText || input.name,
                    position: image.position,
                    isPrimary: image.isPrimary,
                  })),
                }
              : undefined,
          },
        });

        return {
          paths: {
            oldSlug: existing.slug,
            oldCategorySlug: existing.category.slug,
            newCategorySlug: selectedCategory.slug,
            removedPublicIds: normalizedImages.removedPublicIds,
          },
        };
      },
      { isolationLevel: "Serializable" },
    );

    if ("missing" in result) return failure("This product no longer exists.");
    if ("categoryMissing" in result) {
      return failure("The selected category is unavailable.", {
        categoryId: ["Select an active category."],
      });
    }
    if ("slugConflict" in result) {
      return failure("A product with this slug already exists.", {
        slug: ["Choose a unique slug."],
      });
    }
    if ("imageError" in result && result.imageError) {
      return failure(result.imageError, { imageMetadata: [result.imageError] });
    }
    paths = result.paths;
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === "P2002") {
      return failure("A product with this slug already exists.", {
        slug: ["Choose a unique slug."],
      });
    }
    if (code === "P2034") {
      return failure("Another product changed at the same time. Please try again.");
    }

    console.error("Product update failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
    return failure("The product could not be updated. Please try again.");
  }

  if (!paths) return failure("The product could not be updated. Please try again.");

  revalidatePath("/admin/products");
  revalidatePath("/plants");
  revalidatePath(`/plants/${paths.oldSlug}`);
  revalidatePath(`/plants/${input.slug}`);
  revalidatePath(`/categories/${paths.oldCategorySlug}`);
  revalidatePath(`/categories/${paths.newCategorySlug}`);
  await Promise.allSettled(
    paths.removedPublicIds.map(async (publicId) => {
      try {
        await destroyCloudinaryImage(publicId);
      } catch (error) {
        console.error("Removed Cloudinary image cleanup failed.", {
          name: error instanceof Error ? error.name : "UnknownError",
          publicId,
        });
      }
    }),
  );
  redirect("/admin/products?updated=1");
}
