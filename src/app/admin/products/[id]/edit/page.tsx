import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductEditForm } from "@/components/admin/products/product-create-form";
import { productIdSchema } from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { EditableAdminProduct, ProductCategoryOption } from "@/types/admin-product";

export const metadata: Metadata = {
  title: "Edit Product",
  description: "Update a Pick Plant catalog product.",
};

function growingLocation(value: string | null): EditableAdminProduct["indoorOutdoor"] {
  return value === "Indoor" || value === "Outdoor" || value === "Both" ? value : "";
}

function difficulty(value: string | null): EditableAdminProduct["difficulty"] {
  return value === "Easy" || value === "Medium" || value === "Hard" ? value : "";
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  await requireAdmin(`/admin/products/${rawId}/edit`);
  const productId = productIdSchema.safeParse(rawId);
  if (!productId.success) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId.data },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      shortDescription: true,
      description: true,
      price: true,
      compareAtPrice: true,
      sku: true,
      stockQuantity: true,
      lowStockThreshold: true,
      plantSize: true,
      indoorOutdoor: true,
      difficulty: true,
      lightRequirement: true,
      waterRequirement: true,
      status: true,
      isFeatured: true,
      seoTitle: true,
      seoDescription: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
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
          isPrimary: true,
        },
      },
    },
  });
  if (!product) notFound();

  const categories: ProductCategoryOption[] = await prisma.category.findMany({
    where: { OR: [{ isActive: true }, { id: product.categoryId }] },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const primaryImageIndex = product.images.findIndex((image) => image.isPrimary);
  const mainImageIndex = primaryImageIndex >= 0 ? primaryImageIndex : product.images.length ? 0 : -1;
  const regularPrice = product.compareAtPrice ?? product.price;

  const editableProduct: EditableAdminProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    regularPrice: regularPrice.toString(),
    salePrice: product.compareAtPrice ? product.price.toString() : "",
    sku: product.sku,
    stockQuantity: String(product.stockQuantity),
    lowStockThreshold:
      product.lowStockThreshold === null ? "" : String(product.lowStockThreshold),
    plantSize: product.plantSize ?? "",
    indoorOutdoor: growingLocation(product.indoorOutdoor),
    difficulty: difficulty(product.difficulty),
    lightRequirement: product.lightRequirement ?? "",
    waterRequirement: product.waterRequirement ?? "",
    mainImageUrl: mainImageIndex >= 0 ? product.images[mainImageIndex].url : "",
    additionalImageUrls: product.images
      .filter((_, index) => index !== mainImageIndex)
      .map((image) => image.url),
    images: product.images.map((image, index) => ({
      id: image.id,
      publicId: image.publicId,
      secureUrl: image.secureUrl ?? image.url,
      width: image.width,
      height: image.height,
      format: image.format,
      bytes: image.bytes,
      altText: image.altText ?? "",
      originalName: image.publicId?.split("/").pop() ?? `Product image ${index + 1}`,
      isPrimary: index === mainImageIndex,
      position: index,
    })),
    status: product.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
    isFeatured: product.isFeatured,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
  };

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to products
      </Link>
      <header className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Edit {product.name}</h1>
        <p className="mt-2 leading-7 text-[var(--muted)]">
          Update catalog, inventory, care, media, and publishing information.
        </p>
      </header>
      <ProductEditForm categories={categories} product={editableProduct} />
    </div>
  );
}
