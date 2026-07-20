"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { productIdSchema } from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { destroyCloudinaryImage } from "@/lib/cloudinary";
import type { ProductMutationState } from "@/types/admin-product";

const booleanValueSchema = z.enum(["true", "false"]);
const publishingStatusSchema = z.enum(["ACTIVE", "DRAFT"]);

function failure(message: string): ProductMutationState {
  return { status: "error", message };
}

function databaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

function refreshProductPaths(product: { slug: string; categorySlug: string }) {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
  revalidatePath("/plants");
  revalidatePath(`/plants/${product.slug}`);
  revalidatePath(`/categories/${product.categorySlug}`);
}

export async function toggleProductFeaturedAction(
  _previousState: ProductMutationState,
  formData: FormData,
): Promise<ProductMutationState> {
  await requireAdmin("/admin/products");
  const productId = productIdSchema.safeParse(formData.get("productId"));
  const featured = booleanValueSchema.safeParse(formData.get("featured"));
  if (!productId.success || !featured.success) return failure("The featured update is invalid.");

  try {
    const product = await prisma.product.update({
      where: { id: productId.data },
      data: { isFeatured: featured.data === "true" },
      select: { slug: true, category: { select: { slug: true } } },
    });
    refreshProductPaths({ slug: product.slug, categorySlug: product.category.slug });
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === "P2025") return failure("This product no longer exists.");
    console.error("Product featured toggle failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
    return failure("Featured status could not be updated. Please try again.");
  }

  return {
    status: "success",
    message: featured.data === "true" ? "Product marked as featured." : "Featured status removed.",
  };
}

export async function toggleProductPublishingAction(
  _previousState: ProductMutationState,
  formData: FormData,
): Promise<ProductMutationState> {
  await requireAdmin("/admin/products");
  const productId = productIdSchema.safeParse(formData.get("productId"));
  const status = publishingStatusSchema.safeParse(formData.get("status"));
  if (!productId.success || !status.success) return failure("The publishing update is invalid.");

  try {
    const product = await prisma.product.update({
      where: { id: productId.data },
      data: { status: status.data },
      select: { slug: true, category: { select: { slug: true } } },
    });
    refreshProductPaths({ slug: product.slug, categorySlug: product.category.slug });
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === "P2025") return failure("This product no longer exists.");
    console.error("Product publishing toggle failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
    return failure("Publishing status could not be updated. Please try again.");
  }

  return {
    status: "success",
    message: status.data === "ACTIVE" ? "Product published." : "Product moved to draft.",
  };
}

export async function deleteProductAction(
  _previousState: ProductMutationState,
  formData: FormData,
): Promise<ProductMutationState> {
  await requireAdmin("/admin/products");
  const productId = productIdSchema.safeParse(formData.get("productId"));
  if (!productId.success) return failure("The selected product is invalid.");

  let deleted: { slug: string; categorySlug: string; publicIds: string[] } | undefined;
  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const product = await transaction.product.findUnique({
          where: { id: productId.data },
          select: {
            id: true,
            slug: true,
            category: { select: { slug: true } },
            images: { select: { publicId: true } },
            _count: { select: { cartItems: true } },
          },
        });
        if (!product) return { missing: true as const };
        if (product._count.cartItems > 0) return { inCarts: true as const };

        await transaction.productImage.deleteMany({ where: { productId: product.id } });
        await transaction.product.delete({ where: { id: product.id } });
        return {
          deleted: {
            slug: product.slug,
            categorySlug: product.category.slug,
            publicIds: product.images
              .map((image) => image.publicId)
              .filter((publicId): publicId is string => Boolean(publicId)),
          },
        };
      },
      { isolationLevel: "Serializable" },
    );

    if ("missing" in result) return failure("This product no longer exists.");
    if ("inCarts" in result) {
      return failure("This product is currently in one or more carts and cannot be deleted safely.");
    }
    deleted = result.deleted;
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === "P2003") {
      return failure("This product is still referenced by store data and cannot be deleted safely.");
    }
    if (code === "P2034") return failure("Store data changed at the same time. Please try again.");
    console.error("Product deletion failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
    return failure("The product could not be deleted. Please try again.");
  }

  if (!deleted) return failure("The product could not be deleted. Please try again.");
  refreshProductPaths(deleted);
  await Promise.allSettled(
    deleted.publicIds.map(async (publicId) => {
      try {
        await destroyCloudinaryImage(publicId);
      } catch (error) {
        console.error("Deleted product Cloudinary cleanup failed.", {
          name: error instanceof Error ? error.name : "UnknownError",
          publicId,
        });
      }
    }),
  );
  redirect("/admin/products?deleted=1");
}
