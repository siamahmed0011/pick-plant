import { z } from "zod";
import { createSlug } from "@/lib/slug";
import type { ProductFormField } from "@/types/admin-product";

const moneyPattern = /^\d+(?:\.\d{1,2})?$/;

function isWebImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const requiredMoney = z
  .string()
  .trim()
  .min(1, "Price is required.")
  .refine((value) => moneyPattern.test(value), "Enter a valid price with up to 2 decimal places.")
  .transform(Number)
  .refine((value) => value > 0, "Price must be greater than zero.")
  .refine((value) => value <= 9_999_999_999.99, "Price is too large.");

const optionalMoney = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || moneyPattern.test(value),
    "Enter a valid sale price with up to 2 decimal places.",
  )
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || value > 0, "Sale price must be greater than zero.")
  .refine((value) => value === null || value <= 9_999_999_999.99, "Sale price is too large.");

const optionalImageUrl = z
  .string()
  .trim()
  .max(2048, "Image URL must be 2048 characters or fewer.")
  .refine(isWebImageUrl, "Enter a valid HTTP(S) or site-relative image URL.");

const imageDraftSchema = z.object({
  id: z.string().uuid().optional(),
  publicId: z.string().trim().max(512).nullable(),
  secureUrl: z.string().trim().url().max(2048),
  width: z.number().int().positive().max(20_000).nullable(),
  height: z.number().int().positive().max(20_000).nullable(),
  format: z.string().trim().max(20).nullable(),
  bytes: z.number().int().nonnegative().max(5 * 1024 * 1024).nullable(),
  altText: z.string().trim().max(160, "Alt text must be 160 characters or fewer."),
  originalName: z.string().trim().max(255).optional(),
  isPrimary: z.boolean(),
  position: z.number().int().nonnegative().max(7),
});

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Product name must be at least 2 characters.")
      .max(120, "Product name must be 120 characters or fewer."),
    slug: z
      .string()
      .trim()
      .max(140, "Slug must be 140 characters or fewer.")
      .refine(
        (value) => value.length === 0 || createSlug(value) === value,
        "Use lowercase letters, numbers, and single hyphens only.",
      ),
    categoryId: z.string().uuid("Select a valid category."),
    shortDescription: z
      .string()
      .trim()
      .max(300, "Short description must be 300 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(10_000, "Description must be 10,000 characters or fewer."),
    regularPrice: requiredMoney,
    salePrice: optionalMoney,
    sku: z
      .string()
      .trim()
      .max(160, "SKU must be 160 characters or fewer.")
      .refine(
        (value) => value === "" || /^[\p{L}\p{N}_-]+$/u.test(value),
        "Use letters, numbers, hyphens, or underscores only.",
      ),
    stockQuantity: z
      .string()
      .trim()
      .min(1, "Stock is required.")
      .refine((value) => /^\d+$/.test(value), "Stock must be a non-negative whole number.")
      .transform(Number)
      .refine((value) => value <= 2_147_483_647, "Stock is too large."),
    lowStockThreshold: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+$/.test(value), "Enter a whole number.")
      .transform((value) => (value === "" ? null : Number(value)))
      .refine(
        (value) => value === null || value <= 2_147_483_647,
        "Low-stock threshold is too large.",
      ),
    plantSize: z.string().trim().max(80, "Plant size must be 80 characters or fewer."),
    indoorOutdoor: z.enum(["", "Indoor", "Outdoor", "Both"], {
      error: "Select a valid growing location.",
    }),
    difficulty: z.enum(["", "Easy", "Medium", "Hard"], {
      error: "Select a valid difficulty.",
    }),
    lightRequirement: z
      .string()
      .trim()
      .max(120, "Light requirement must be 120 characters or fewer."),
    waterRequirement: z
      .string()
      .trim()
      .max(120, "Water requirement must be 120 characters or fewer."),
    mainImageUrl: optionalImageUrl,
    additionalImageUrls: z
      .array(optionalImageUrl)
      .max(8, "You can add up to 8 additional images."),
    imageMetadata: z.array(imageDraftSchema).max(8, "You can add up to 8 images."),
    status: z.enum(["DRAFT", "ACTIVE"], { error: "Select a valid product status." }),
    isFeatured: z.boolean(),
    seoTitle: z.string().trim().max(70, "SEO title must be 70 characters or fewer."),
    seoDescription: z
      .string()
      .trim()
      .max(160, "SEO description must be 160 characters or fewer."),
  })
  .transform((data) => {
    const slug = data.slug || createSlug(data.name);
    const sku = (data.sku || `PP-${slug}`).toUpperCase();
    const additionalImageUrls = data.additionalImageUrls.filter(Boolean);

    return {
      ...data,
      slug,
      sku,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      plantSize: data.plantSize || null,
      indoorOutdoor: data.indoorOutdoor || null,
      difficulty: data.difficulty || null,
      lightRequirement: data.lightRequirement || null,
      waterRequirement: data.waterRequirement || null,
      mainImageUrl: data.mainImageUrl || null,
      additionalImageUrls: Array.from(new Set(additionalImageUrls)),
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    };
  })
  .superRefine((data, context) => {
    const images = data.imageMetadata;
    const primaryCount = images.filter((image) => image.isPrimary).length;
    if (images.length > 0 && primaryCount !== 1) {
      context.addIssue({
        code: "custom",
        path: ["imageMetadata"],
        message: "Choose exactly one primary image.",
      });
    }
    if (images.some((image, index) => image.position !== index)) {
      context.addIssue({
        code: "custom",
        path: ["imageMetadata"],
        message: "Image order is invalid. Reorder the images and try again.",
      });
    }
    if (data.slug.length < 2) {
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Enter a name that can produce a slug with at least 2 letters or numbers.",
      });
    }
    if (data.salePrice !== null && data.salePrice > data.regularPrice) {
      context.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "Sale price must not exceed the regular price.",
      });
    }
    if (data.mainImageUrl && data.additionalImageUrls.includes(data.mainImageUrl)) {
      context.addIssue({
        code: "custom",
        path: ["additionalImageUrls"],
        message: "Remove the main image from the additional images.",
      });
    }
  });

export const productIdSchema = z.string().uuid("The selected product is invalid.");

export function productFormData(formData: FormData) {
  const rawImageMetadata = String(formData.get("imageMetadata") ?? "[]");
  let imageMetadata: unknown = [];
  try {
    imageMetadata = JSON.parse(rawImageMetadata);
  } catch {
    imageMetadata = [];
  }

  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    regularPrice: String(formData.get("regularPrice") ?? ""),
    salePrice: String(formData.get("salePrice") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    stockQuantity: String(formData.get("stockQuantity") ?? ""),
    lowStockThreshold: String(formData.get("lowStockThreshold") ?? ""),
    plantSize: String(formData.get("plantSize") ?? ""),
    indoorOutdoor: String(formData.get("indoorOutdoor") ?? ""),
    difficulty: String(formData.get("difficulty") ?? ""),
    lightRequirement: String(formData.get("lightRequirement") ?? ""),
    waterRequirement: String(formData.get("waterRequirement") ?? ""),
    mainImageUrl: String(formData.get("mainImageUrl") ?? ""),
    additionalImageUrls: formData
      .getAll("additionalImageUrls")
      .map((value) => String(value)),
    imageMetadata,
    status: String(formData.get("status") ?? ""),
    isFeatured: formData.get("isFeatured") === "on",
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  } satisfies Record<ProductFormField, unknown>;
}
