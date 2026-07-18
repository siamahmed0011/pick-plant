import type { CategoryFormField } from "@/lib/admin/category-validation";

export type CategoryActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<CategoryFormField, string[]>>;
};

export const initialCategoryActionState: CategoryActionState = {
  status: "idle",
  message: "",
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  productCount: number;
};
