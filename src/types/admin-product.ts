export type ProductFormField =
  | "name"
  | "slug"
  | "categoryId"
  | "shortDescription"
  | "description"
  | "regularPrice"
  | "salePrice"
  | "sku"
  | "stockQuantity"
  | "lowStockThreshold"
  | "plantSize"
  | "indoorOutdoor"
  | "difficulty"
  | "lightRequirement"
  | "waterRequirement"
  | "mainImageUrl"
  | "additionalImageUrls"
  | "imageMetadata"
  | "status"
  | "isFeatured"
  | "seoTitle"
  | "seoDescription";

export type ProductActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ProductFormField, string[]>>;
};

export const initialProductActionState: ProductActionState = { status: "idle" };

export type ProductMutationState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialProductMutationState: ProductMutationState = { status: "idle" };

export type ProductCategoryOption = {
  id: string;
  name: string;
};

export type ProductImageDraft = {
  id?: string;
  publicId: string | null;
  secureUrl: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  altText: string;
  originalName?: string;
  isPrimary: boolean;
  position: number;
};

export type EditableAdminProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  regularPrice: string;
  salePrice: string;
  sku: string;
  stockQuantity: string;
  lowStockThreshold: string;
  plantSize: string;
  indoorOutdoor: "" | "Indoor" | "Outdoor" | "Both";
  difficulty: "" | "Easy" | "Medium" | "Hard";
  lightRequirement: string;
  waterRequirement: string;
  mainImageUrl: string;
  additionalImageUrls: string[];
  images: ProductImageDraft[];
  status: "DRAFT" | "ACTIVE";
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
};
