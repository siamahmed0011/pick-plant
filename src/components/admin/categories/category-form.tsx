"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/admin/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSlug } from "@/lib/slug";
import {
  initialCategoryActionState,
  type AdminCategory,
  type CategoryActionState,
} from "@/types/admin-category";

function FieldError({
  id,
  errors,
}: {
  id: string;
  errors: string[] | undefined;
}) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm text-[var(--danger)]" role="alert">
      {errors[0]}
    </p>
  );
}

export function CategoryForm({
  category,
  onSuccess,
}: {
  category?: AdminCategory;
  onSuccess: () => void;
}) {
  const action = category ? updateCategoryAction : createCategoryAction;
  const [state, formAction, pending] = useActionState<CategoryActionState, FormData>(
    action,
    initialCategoryActionState,
  );
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));

  useEffect(() => {
    if (state.status === "success") onSuccess();
  }, [onSuccess, state.status]);

  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      <label className="grid gap-2 font-medium">
        Name <span className="sr-only">required</span>
        <Input
          name="name"
          value={name}
          required
          minLength={2}
          maxLength={80}
          autoComplete="off"
          aria-invalid={Boolean(errors?.name)}
          aria-describedby={errors?.name ? "category-name-error" : undefined}
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            if (!slugEdited) setSlug(createSlug(nextName));
          }}
          placeholder="Indoor Plants"
        />
        <FieldError id="category-name-error" errors={errors?.name} />
      </label>
      <label className="grid gap-2 font-medium">
        Slug
        <Input
          name="slug"
          value={slug}
          maxLength={100}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(errors?.slug)}
          aria-describedby="category-slug-help category-slug-error"
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(event.target.value.length > 0);
          }}
          onBlur={() => setSlug((current) => (current ? createSlug(current) : ""))}
          placeholder="indoor-plants"
        />
        <p id="category-slug-help" className="text-xs font-normal text-[var(--muted)]">
          Generated from the name until you edit it. Leave blank to generate it on save.
        </p>
        <FieldError id="category-slug-error" errors={errors?.slug} />
      </label>
      <label className="grid gap-2 font-medium">
        Description <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
        <Textarea
          name="description"
          defaultValue={category?.description ?? ""}
          maxLength={1000}
          aria-invalid={Boolean(errors?.description)}
          aria-describedby={errors?.description ? "category-description-error" : undefined}
          placeholder="A short description for this category."
        />
        <FieldError id="category-description-error" errors={errors?.description} />
      </label>
      <label className="grid gap-2 font-medium">
        Status
        <Select
          name="status"
          defaultValue={category?.isActive === false ? "INACTIVE" : "ACTIVE"}
          aria-invalid={Boolean(errors?.status)}
          aria-describedby={errors?.status ? "category-status-error" : undefined}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <FieldError id="category-status-error" errors={errors?.status} />
      </label>
      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]" role="alert">
          {state.message}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        <Button type="submit" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
          {pending ? "Saving…" : category ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
