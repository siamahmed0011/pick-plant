"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  productFormData,
  productFormSchema,
} from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { normalizeProductImages } from "@/lib/admin/product-images";
import { recordInitialInventoryMovement } from "@/lib/admin/inventory";
import { moveCloudinaryImage } from "@/lib/cloudinary";
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

export async function createProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await requireAdmin("/admin/products/new");
  const parsed = productFormSchema.safeParse(productFormData(formData));

  if (!parsed.success) {
    return failure(
      "Review the highlighted product details and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const input = parsed.data;

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const [category, conflicts] = await Promise.all([
          transaction.category.findFirst({
            where: { id: input.categoryId, isActive: true },
            select: { id: true },
          }),
          transaction.product.findMany({
            where: { OR: [{ slug: input.slug }, { sku: input.sku }] },
            select: { slug: true, sku: true },
          }),
        ]);

        if (!category) return { categoryMissing: true as const };

        const fieldErrors: Partial<Record<ProductFormField, string[]>> = {};
        if (conflicts.some((product) => product.slug === input.slug)) {
          fieldErrors.slug = ["A product with this slug already exists."];
        }
        if (conflicts.some((product) => product.sku === input.sku)) {
          fieldErrors.sku = ["A product with this SKU already exists."];
        }
        if (Object.keys(fieldErrors).length) return { fieldErrors };
        const normalizedImages = normalizeProductImages({
          drafts: input.imageMetadata,
          existing: [],
          creating: true,
        });
        if ("error" in normalizedImages) return { imageError: normalizedImages.error };

        const created = await transaction.product.create({
          data: {
            categoryId: input.categoryId,
            name: input.name,
            slug: input.slug,
            sku: input.sku,
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

        await recordInitialInventoryMovement(
          transaction,
          created,
          { id: session.user.id, name: session.user.name, email: session.user.email },
        );

        return {
          productId: created.id,
          tempPublicIds: normalizedImages.images
            .map((image) => image.publicId)
            .filter((publicId): publicId is string => Boolean(publicId)),
        };
      },
      { isolationLevel: "Serializable" },
    );

    if (result && "categoryMissing" in result) {
      return failure("The selected category is unavailable. Choose an active category.", {
        categoryId: ["Select an active category."],
      });
    }
    if (result && "fieldErrors" in result) {
      return failure("A product with these details already exists.", result.fieldErrors);
    }
    if (result && "imageError" in result && result.imageError) {
      return failure(result.imageError, { imageMetadata: [result.imageError] });
    }
    if (result && "productId" in result && "tempPublicIds" in result && result.tempPublicIds) {
      await Promise.allSettled(result.tempPublicIds.map(async (sourcePublicId) => {
        const destinationPublicId = `pick-plant/products/${result.productId}/${sourcePublicId.split("/").pop()}`;
        try {
          const moved = await moveCloudinaryImage(sourcePublicId, destinationPublicId);
          await prisma.productImage.updateMany({
            where: { productId: result.productId, publicId: sourcePublicId },
            data: {
              publicId: destinationPublicId,
              secureUrl: moved.secure_url,
              url: moved.secure_url,
            },
          });
        } catch (error) {
          console.error("Temporary Cloudinary image promotion failed.", {
            name: error instanceof Error ? error.name : "UnknownError",
            sourcePublicId,
          });
        }
      }));
    }
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === "P2002") {
      return failure("The slug or SKU is already in use. Choose unique values.", {
        slug: ["Choose a unique slug."],
        sku: ["Choose a unique SKU."],
      });
    }
    if (code === "P2034") {
      return failure("Another product changed at the same time. Please try again.");
    }

    console.error("Product creation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
    return failure("The product could not be created. Please try again.");
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
  revalidatePath("/plants");
  revalidatePath(`/plants/${input.slug}`);
  redirect("/admin/products?created=1");
}
