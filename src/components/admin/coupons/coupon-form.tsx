"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { CouponType } from "@/generated/prisma/enums";

type CategoryOption = { id: string; name: string };
type ProductOption = { id: string; name: string; sku: string };

type CouponFormProps = {
  initialData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: CouponType;
    value: number;
    minimumOrderAmount: number | null;
    maximumDiscountAmount: number | null;
    usageLimit: number | null;
    usageLimitPerCustomer: number | null;
    startsAt: Date | null;
    expiresAt: Date | null;
    isActive: boolean;
    appliesToAllProducts: boolean;
    targetProductIds?: string[];
    targetCategoryIds?: string[];
  };
  categories: CategoryOption[];
  products: ProductOption[];
};

export function CouponForm({ initialData, categories, products }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(initialData?.code || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState<CouponType>(initialData?.type || CouponType.PERCENTAGE);
  const [value, setValue] = useState(initialData?.value !== undefined ? initialData.value.toString() : "");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(
    initialData?.minimumOrderAmount !== null && initialData?.minimumOrderAmount !== undefined
      ? initialData.minimumOrderAmount.toString()
      : ""
  );
  const [maximumDiscountAmount, setMaximumDiscountAmount] = useState(
    initialData?.maximumDiscountAmount !== null && initialData?.maximumDiscountAmount !== undefined
      ? initialData.maximumDiscountAmount.toString()
      : ""
  );
  const [usageLimit, setUsageLimit] = useState(
    initialData?.usageLimit !== null && initialData?.usageLimit !== undefined
      ? initialData.usageLimit.toString()
      : ""
  );
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState(
    initialData?.usageLimitPerCustomer !== null && initialData?.usageLimitPerCustomer !== undefined
      ? initialData.usageLimitPerCustomer.toString()
      : ""
  );
  const [startsAt, setStartsAt] = useState(
    initialData?.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : ""
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [appliesToAllProducts, setAppliesToAllProducts] = useState(
    initialData?.appliesToAllProducts ?? true
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialData?.targetProductIds || []
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.targetCategoryIds || []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || null,
        type,
        value: parseFloat(value),
        minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
        maximumDiscountAmount: maximumDiscountAmount ? parseFloat(maximumDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        usageLimitPerCustomer: usageLimitPerCustomer ? parseInt(usageLimitPerCustomer, 10) : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
        appliesToAllProducts,
        targetProductIds: appliesToAllProducts ? [] : selectedProductIds,
        targetCategoryIds: appliesToAllProducts ? [] : selectedCategoryIds,
      };

      const url = initialData ? `/api/admin/coupons/${initialData.id}` : "/api/admin/coupons";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save coupon.");

      router.push("/admin/coupons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={16} /> Back to Coupons
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary)]/90 disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? "Saving..." : initialData ? "Update Coupon" : "Create Coupon"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Main Details */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SUMMER20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono text-sm font-bold tracking-wider uppercase focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              Coupon Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Summer Special 20% Off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-700">Description</label>
          <textarea
            rows={2}
            placeholder="Internal notes or terms for this promotion..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Discount Configuration</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Discount Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            >
              <option value={CouponType.PERCENTAGE}>Percentage (%)</option>
              <option value={CouponType.FIXED_AMOUNT}>Fixed Amount (৳)</option>
              <option value={CouponType.FREE_SHIPPING}>Free Shipping</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              Value {type === CouponType.PERCENTAGE ? "(%)" : "(৳)"} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required={type !== CouponType.FREE_SHIPPING}
              placeholder={type === CouponType.PERCENTAGE ? "15" : "150"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={type === CouponType.FREE_SHIPPING}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none disabled:bg-stone-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              Max Discount Amount (৳)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 500 (Optional cap)"
              value={maximumDiscountAmount}
              onChange={(e) => setMaximumDiscountAmount(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              Minimum Subtotal (৳)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 1000"
              value={minimumOrderAmount}
              onChange={(e) => setMinimumOrderAmount(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Total Usage Limit</label>
            <input
              type="number"
              placeholder="e.g. 100 (Blank for unlimited)"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Limit Per Customer</label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={usageLimitPerCustomer}
              onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Date Range & Status */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Validity & Status</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Expiration Date & Time</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border-stone-300 text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <label htmlFor="isActive" className="text-sm font-semibold text-stone-800">
            Activate this coupon immediately
          </label>
        </div>
      </div>

      {/* Product Targeting */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Product & Category Targeting</h2>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="appliesToAllProducts"
            checked={appliesToAllProducts}
            onChange={(e) => setAppliesToAllProducts(e.target.checked)}
            className="size-4 rounded border-stone-300 text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <label htmlFor="appliesToAllProducts" className="text-sm font-semibold text-stone-800">
            Applies to all products in storefront
          </label>
        </div>

        {!appliesToAllProducts && (
          <div className="grid gap-6 pt-2 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-stone-700">Target Categories</label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 p-3 space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-xs font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                        } else {
                          setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== cat.id));
                        }
                      }}
                      className="size-3.5 rounded border-stone-300 text-[var(--primary)]"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-stone-700">Target Products</label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 p-3 space-y-2">
                {products.map((prod) => (
                  <label key={prod.id} className="flex items-center gap-2 text-xs font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(prod.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds([...selectedProductIds, prod.id]);
                        } else {
                          setSelectedProductIds(selectedProductIds.filter((id) => id !== prod.id));
                        }
                      }}
                      className="size-3.5 rounded border-stone-300 text-[var(--primary)]"
                    />
                    {prod.name} ({prod.sku})
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
