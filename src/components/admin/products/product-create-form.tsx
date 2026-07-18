"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateProductAction } from "@/app/admin/products/[id]/edit/actions";
import { createProductAction } from "@/app/admin/products/new/actions";
import { ProductFormSection } from "@/components/admin/products/product-form-section";
import { ProductImageUploader } from "@/components/admin/products/product-image-uploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSlug } from "@/lib/slug";
import {
  initialProductActionState,
  type EditableAdminProduct,
  type ProductCategoryOption,
  type ProductFormField,
} from "@/types/admin-product";

function FieldError({
  field,
  errors,
}: {
  field: ProductFormField;
  errors: Partial<Record<ProductFormField, string[]>> | undefined;
}) {
  const messages = errors?.[field];
  if (!messages?.length) return null;
  return (
    <p id={`${field}-error`} className="text-sm text-[var(--danger)]" role="alert">
      {messages[0]}
    </p>
  );
}

function describedBy(field: ProductFormField, hasError: boolean, helpId?: string) {
  return [helpId, hasError ? `${field}-error` : null].filter(Boolean).join(" ") || undefined;
}

function ProductForm({
  categories,
  product,
}: {
  categories: ProductCategoryOption[];
  product?: EditableAdminProduct;
}) {
  const editing = Boolean(product);
  const [state, formAction, pending] = useActionState(
    editing ? updateProductAction : createProductAction,
    initialProductActionState,
  );
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(editing);
  const [imageMetadata, setImageMetadata] = useState(product?.images ?? []);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="mt-8" noValidate>
      {product && <input type="hidden" name="productId" value={product.id} />}
      {state.status === "error" && (
        <div
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="grid min-w-0 gap-6">
          <ProductFormSection
            title="General Information"
            description="Add the core catalogue information customers will see."
          >
            <label className="grid gap-2 font-medium">
              Product Name <span className="sr-only">required</span>
              <Input
                name="name"
                value={name}
                required
                minLength={2}
                maxLength={120}
                autoComplete="off"
                placeholder="Monstera Deliciosa"
                aria-invalid={Boolean(errors?.name)}
                aria-describedby={describedBy("name", Boolean(errors?.name))}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slugEdited) setSlug(createSlug(nextName));
                }}
              />
              <FieldError field="name" errors={errors} />
            </label>

            <label className="grid gap-2 font-medium">
              Slug <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
              <Input
                name="slug"
                value={slug}
                maxLength={140}
                autoComplete="off"
                spellCheck={false}
                placeholder="monstera-deliciosa"
                aria-invalid={Boolean(errors?.slug)}
                aria-describedby={describedBy("slug", Boolean(errors?.slug), "slug-help")}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugEdited(event.target.value.length > 0);
                }}
                onBlur={() => setSlug((current) => (current ? createSlug(current) : ""))}
              />
              <p id="slug-help" className="text-xs font-normal text-[var(--muted)]">
                Generated from the product name until you edit it.
              </p>
              <FieldError field="slug" errors={errors} />
            </label>

            <label className="grid gap-2 font-medium">
              Category <span className="sr-only">required</span>
              <Select
                name="categoryId"
                required
                defaultValue={product?.categoryId ?? ""}
                aria-invalid={Boolean(errors?.categoryId)}
                aria-describedby={describedBy("categoryId", Boolean(errors?.categoryId))}
              >
                <option value="" disabled>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
              <FieldError field="categoryId" errors={errors} />
            </label>

            <label className="grid gap-2 font-medium">
              Short Description <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
              <Textarea
                name="shortDescription"
                defaultValue={product?.shortDescription ?? ""}
                maxLength={300}
                className="min-h-24"
                placeholder="A concise description for product cards and search results."
                aria-invalid={Boolean(errors?.shortDescription)}
                aria-describedby={describedBy("shortDescription", Boolean(errors?.shortDescription))}
              />
              <FieldError field="shortDescription" errors={errors} />
            </label>

            <label className="grid gap-2 font-medium">
              Full Description <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
              <Textarea
                name="description"
                defaultValue={product?.description ?? ""}
                maxLength={10000}
                className="min-h-40"
                placeholder="Describe the plant, its character, and ideal use."
                aria-invalid={Boolean(errors?.description)}
                aria-describedby={describedBy("description", Boolean(errors?.description))}
              />
              <FieldError field="description" errors={errors} />
            </label>
          </ProductFormSection>

          <ProductFormSection
            title="Pricing"
            description="Set the regular price and an optional lower sale price."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 font-medium">
                Price (BDT) <span className="sr-only">required</span>
                <Input
                  name="regularPrice"
                  defaultValue={product?.regularPrice ?? ""}
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="650.00"
                  aria-invalid={Boolean(errors?.regularPrice)}
                  aria-describedby={describedBy("regularPrice", Boolean(errors?.regularPrice))}
                />
                <FieldError field="regularPrice" errors={errors} />
              </label>
              <label className="grid gap-2 font-medium">
                Sale Price (BDT) <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Input
                  name="salePrice"
                  defaultValue={product?.salePrice ?? ""}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="550.00"
                  aria-invalid={Boolean(errors?.salePrice)}
                  aria-describedby={describedBy("salePrice", Boolean(errors?.salePrice))}
                />
                <FieldError field="salePrice" errors={errors} />
              </label>
            </div>
          </ProductFormSection>

          <ProductFormSection
            title="Inventory"
            description="Track this plant by SKU and keep stock alerts useful."
          >
            <label className="grid gap-2 font-medium">
              SKU <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
              <Input
                name="sku"
                defaultValue={product?.sku ?? ""}
                maxLength={160}
                autoComplete="off"
                spellCheck={false}
                readOnly={editing}
                placeholder="PP-MONSTERA-DELICIOSA"
                aria-invalid={Boolean(errors?.sku)}
                aria-describedby={describedBy("sku", Boolean(errors?.sku), "sku-help")}
              />
              <p id="sku-help" className="text-xs font-normal text-[var(--muted)]">
                {editing
                  ? "SKU is preserved during editing."
                  : "Leave blank to generate it from the slug."}
              </p>
              <FieldError field="sku" errors={errors} />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 font-medium">
                Stock <span className="sr-only">required</span>
                <Input
                  name="stockQuantity"
                  type="number"
                  required
                  min="0"
                  step="1"
                  inputMode="numeric"
                  defaultValue={product?.stockQuantity ?? "0"}
                  aria-invalid={Boolean(errors?.stockQuantity)}
                  aria-describedby={describedBy("stockQuantity", Boolean(errors?.stockQuantity))}
                />
                <FieldError field="stockQuantity" errors={errors} />
              </label>
              <label className="grid gap-2 font-medium">
                Low Stock Threshold <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Input
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  defaultValue={product?.lowStockThreshold ?? ""}
                  placeholder="5"
                  aria-invalid={Boolean(errors?.lowStockThreshold)}
                  aria-describedby={describedBy("lowStockThreshold", Boolean(errors?.lowStockThreshold))}
                />
                <FieldError field="lowStockThreshold" errors={errors} />
              </label>
            </div>
          </ProductFormSection>

          <ProductFormSection
            title="Plant Information"
            description="Optional care details help shoppers choose the right plant."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 font-medium">
                Plant Size <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Input
                  name="plantSize"
                  defaultValue={product?.plantSize ?? ""}
                  maxLength={80}
                  placeholder="Medium, 30–45 cm"
                  aria-invalid={Boolean(errors?.plantSize)}
                  aria-describedby={describedBy("plantSize", Boolean(errors?.plantSize))}
                />
                <FieldError field="plantSize" errors={errors} />
              </label>
              <label className="grid gap-2 font-medium">
                Indoor / Outdoor <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Select
                  name="indoorOutdoor"
                  defaultValue={product?.indoorOutdoor ?? ""}
                  aria-invalid={Boolean(errors?.indoorOutdoor)}
                  aria-describedby={describedBy("indoorOutdoor", Boolean(errors?.indoorOutdoor))}
                >
                  <option value="">Not specified</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Both">Both</option>
                </Select>
                <FieldError field="indoorOutdoor" errors={errors} />
              </label>
              <label className="grid gap-2 font-medium">
                Difficulty <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Select
                  name="difficulty"
                  defaultValue={product?.difficulty ?? ""}
                  aria-invalid={Boolean(errors?.difficulty)}
                  aria-describedby={describedBy("difficulty", Boolean(errors?.difficulty))}
                >
                  <option value="">Not specified</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </Select>
                <FieldError field="difficulty" errors={errors} />
              </label>
              <label className="grid gap-2 font-medium">
                Light Requirement <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Input
                  name="lightRequirement"
                  defaultValue={product?.lightRequirement ?? ""}
                  maxLength={120}
                  placeholder="Bright indirect light"
                  aria-invalid={Boolean(errors?.lightRequirement)}
                  aria-describedby={describedBy("lightRequirement", Boolean(errors?.lightRequirement))}
                />
                <FieldError field="lightRequirement" errors={errors} />
              </label>
              <label className="grid gap-2 font-medium sm:col-span-2">
                Water Requirement <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                <Input
                  name="waterRequirement"
                  defaultValue={product?.waterRequirement ?? ""}
                  maxLength={120}
                  placeholder="Water when topsoil is dry"
                  aria-invalid={Boolean(errors?.waterRequirement)}
                  aria-describedby={describedBy("waterRequirement", Boolean(errors?.waterRequirement))}
                />
                <FieldError field="waterRequirement" errors={errors} />
              </label>
            </div>
          </ProductFormSection>

          <ProductFormSection
            title="Media"
            description="Upload up to eight optimized product images. The first image is primary."
          >
            <ProductImageUploader initialImages={product?.images ?? []} productId={product?.id} onChange={setImageMetadata} />
            <input type="hidden" name="imageMetadata" value={JSON.stringify(imageMetadata)} readOnly />
            <FieldError field="imageMetadata" errors={errors} />
          </ProductFormSection>
        </div>

        <aside className="grid gap-6 xl:sticky xl:top-6">
          <ProductFormSection
            title="Publishing"
            description="Choose whether this product is ready for the storefront."
          >
            <label className="grid gap-2 font-medium">
              Status <span className="sr-only">required</span>
              <Select
                name="status"
                defaultValue={product?.status ?? "DRAFT"}
                required
                aria-invalid={Boolean(errors?.status)}
                aria-describedby={describedBy("status", Boolean(errors?.status))}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Published</option>
              </Select>
              <FieldError field="status" errors={errors} />
            </label>
            <label className="flex items-start gap-3 rounded-xl border p-4">
              <Checkbox
                name="isFeatured"
                defaultChecked={product?.isFeatured ?? false}
                className="mt-1 shrink-0"
              />
              <span>
                <span className="block font-medium">Featured Product</span>
                <span className="mt-1 block text-sm font-normal leading-5 text-[var(--muted)]">
                  Mark this plant for featured catalogue placements.
                </span>
              </span>
            </label>
          </ProductFormSection>

          <ProductFormSection
            title="Search Preview"
            description="Optional metadata for search engines and shared links."
          >
            <label className="grid gap-2 font-medium">
              SEO Title <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
              <Input
                name="seoTitle"
                defaultValue={product?.seoTitle ?? ""}
                maxLength={70}
                placeholder="Buy Monstera Deliciosa"
                aria-invalid={Boolean(errors?.seoTitle)}
                aria-describedby={describedBy("seoTitle", Boolean(errors?.seoTitle))}
              />
              <FieldError field="seoTitle" errors={errors} />
            </label>
            <label className="grid gap-2 font-medium">
              SEO Description <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
              <Textarea
                name="seoDescription"
                defaultValue={product?.seoDescription ?? ""}
                maxLength={160}
                className="min-h-28"
                placeholder="A short search result description."
                aria-invalid={Boolean(errors?.seoDescription)}
                aria-describedby={describedBy("seoDescription", Boolean(errors?.seoDescription))}
              />
              <FieldError field="seoDescription" errors={errors} />
            </label>
          </ProductFormSection>

          <div className="surface flex flex-col-reverse gap-3 p-4 sm:flex-row xl:flex-col-reverse">
            <Link
              href="/admin/products"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--primary)] px-5 font-semibold text-[var(--primary)] transition hover:bg-[var(--muted-surface)]"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
              {pending ? (editing ? "Updating…" : "Saving…") : editing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}

export function ProductCreateForm({ categories }: { categories: ProductCategoryOption[] }) {
  return <ProductForm categories={categories} />;
}

export function ProductEditForm({
  categories,
  product,
}: {
  categories: ProductCategoryOption[];
  product: EditableAdminProduct;
}) {
  return <ProductForm categories={categories} product={product} />;
}
