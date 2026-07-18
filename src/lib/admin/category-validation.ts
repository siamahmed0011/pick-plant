import { z } from "zod";
import { createSlug } from "@/lib/slug";

const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be 80 characters or fewer.");

const categorySlugSchema = z
  .string()
  .trim()
  .max(100, "Slug must be 100 characters or fewer.")
  .refine(
    (value) => value.length === 0 || createSlug(value) === value,
    "Use lowercase letters, numbers, and single hyphens only.",
  );

export const categoryFormSchema = z
  .object({
    name: categoryNameSchema,
    slug: categorySlugSchema,
    description: z
      .string()
      .trim()
      .max(1000, "Description must be 1000 characters or fewer."),
    status: z.enum(["ACTIVE", "INACTIVE"], {
      error: "Select a valid category status.",
    }),
  })
  .transform((data) => ({
    name: data.name,
    slug: data.slug || createSlug(data.name),
    description: data.description || null,
    isActive: data.status === "ACTIVE",
  }))
  .refine((data) => data.slug.length >= 2, {
    message: "Enter a slug with at least 2 letters or numbers.",
    path: ["slug"],
  });

export const categoryIdSchema = z.string().uuid("The selected category is invalid.");

export type CategoryFormField = "name" | "slug" | "description" | "status" | "categoryId";

export function categoryFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
}
