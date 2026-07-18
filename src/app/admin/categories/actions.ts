"use server";

import { revalidatePath } from "next/cache";
import {
  categoryFormData,
  categoryFormSchema,
  categoryIdSchema,
  type CategoryFormField,
} from "@/lib/admin/category-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { CategoryActionState } from "@/types/admin-category";

function validationFailure(
  message: string,
  fieldErrors?: Partial<Record<CategoryFormField, string[]>>,
): CategoryActionState {
  return { status: "error", message, fieldErrors };
}

function getDatabaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

function databaseFailure(error: unknown, fallback: string): CategoryActionState {
  const code = getDatabaseErrorCode(error);

  if (code === "P2002") {
    return validationFailure("A category with this slug already exists.", {
      slug: ["Choose a different slug."],
    });
  }

  if (code === "P2034") {
    return validationFailure("Another category changed at the same time. Please try again.");
  }

  console.error("Category management action failed.", {
    name: error instanceof Error ? error.name : "UnknownError",
    code,
  });
  return validationFailure(fallback);
}

async function findCategoryConflicts(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: { name: string; slug: string },
  excludedId?: string,
) {
  const conflicts = await transaction.category.findMany({
    where: {
      ...(excludedId ? { id: { not: excludedId } } : {}),
      OR: [
        { slug: input.slug },
        { name: { equals: input.name, mode: "insensitive" } },
      ],
    },
    select: { name: true, slug: true },
  });

  const fieldErrors: Partial<Record<CategoryFormField, string[]>> = {};
  if (conflicts.some((category) => category.name.toLowerCase() === input.name.toLowerCase())) {
    fieldErrors.name = ["A category with this name already exists."];
  }
  if (conflicts.some((category) => category.slug === input.slug)) {
    fieldErrors.slug = ["A category with this slug already exists."];
  }

  return fieldErrors;
}

export async function createCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin("/admin/categories");
  const parsed = categoryFormSchema.safeParse(categoryFormData(formData));

  if (!parsed.success) {
    return validationFailure(
      "Review the category details and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const conflicts = await findCategoryConflicts(transaction, parsed.data);
        if (Object.keys(conflicts).length) return conflicts;

        await transaction.category.create({ data: parsed.data });
        return null;
      },
      { isolationLevel: "Serializable" },
    );

    if (result) {
      return validationFailure("A category with these details already exists.", result);
    }
  } catch (error) {
    return databaseFailure(error, "The category could not be created. Please try again.");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { status: "success", message: "Category created successfully." };
}

export async function updateCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin("/admin/categories");
  const categoryId = categoryIdSchema.safeParse(formData.get("categoryId"));
  const parsed = categoryFormSchema.safeParse(categoryFormData(formData));

  if (!categoryId.success || !parsed.success) {
    return validationFailure("Review the category details and try again.", {
      ...(!parsed.success ? parsed.error.flatten().fieldErrors : {}),
      ...(!categoryId.success ? { categoryId: [categoryId.error.issues[0]?.message ?? "Invalid category."] } : {}),
    });
  }

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const category = await transaction.category.findUnique({
          where: { id: categoryId.data },
          select: { id: true },
        });
        if (!category) return { missing: true as const };

        const conflicts = await findCategoryConflicts(
          transaction,
          parsed.data,
          categoryId.data,
        );
        if (Object.keys(conflicts).length) return { conflicts };

        await transaction.category.update({
          where: { id: categoryId.data },
          data: parsed.data,
        });
        return null;
      },
      { isolationLevel: "Serializable" },
    );

    if (result && "missing" in result) {
      return validationFailure("This category no longer exists.");
    }
    if (result && "conflicts" in result) {
      return validationFailure("A category with these details already exists.", result.conflicts);
    }
  } catch (error) {
    return databaseFailure(error, "The category could not be updated. Please try again.");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { status: "success", message: "Category updated successfully." };
}

export async function deleteCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin("/admin/categories");
  const categoryId = categoryIdSchema.safeParse(formData.get("categoryId"));

  if (!categoryId.success) {
    return validationFailure("The selected category is invalid.", {
      categoryId: [categoryId.error.issues[0]?.message ?? "Invalid category."],
    });
  }

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const category = await transaction.category.findUnique({
          where: { id: categoryId.data },
          select: { id: true, _count: { select: { products: true } } },
        });

        if (!category) return "missing" as const;
        if (category._count.products > 0) return "has-products" as const;

        await transaction.category.delete({ where: { id: category.id } });
        return "deleted" as const;
      },
      { isolationLevel: "Serializable" },
    );

    if (result === "missing") return validationFailure("This category no longer exists.");
    if (result === "has-products") {
      return validationFailure("Move or remove the products in this category before deleting it.");
    }
  } catch (error) {
    if (getDatabaseErrorCode(error) === "P2003") {
      return validationFailure("This category still contains products and cannot be deleted.");
    }
    return databaseFailure(error, "The category could not be deleted. Please try again.");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { status: "success", message: "Category deleted successfully." };
}
