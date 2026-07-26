"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";

type ShippingRateInput = {
  id?: string;
  name: string;
  method: string;
  amount: number;
  freeShippingThreshold: number | null;
  estimatedDeliveryText: string | null;
  isActive: boolean;
};

type ShippingZoneFormProps = {
  initialData?: {
    id: string;
    name: string;
    countries: string;
    regions: string | null;
    priority: number;
    isActive: boolean;
    rates: ShippingRateInput[];
  };
};

export function ShippingZoneForm({ initialData }: ShippingZoneFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name || "");
  const [countries, setCountries] = useState(initialData?.countries || "Bangladesh");
  const [regions, setRegions] = useState(initialData?.regions || "");
  const [priority, setPriority] = useState(initialData?.priority !== undefined ? initialData.priority : 0);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [rates, setRates] = useState<ShippingRateInput[]>(
    initialData?.rates || [
      {
        name: "Standard Home Delivery",
        method: "STANDARD",
        amount: 60,
        freeShippingThreshold: 2000,
        estimatedDeliveryText: "2-3 business days",
        isActive: true,
      },
    ]
  );

  function addRate() {
    setRates([
      ...rates,
      {
        name: "Express Delivery",
        method: "EXPRESS",
        amount: 120,
        freeShippingThreshold: null,
        estimatedDeliveryText: "1 business day",
        isActive: true,
      },
    ]);
  }

  function removeRate(index: number) {
    if (rates.length === 1) return;
    setRates(rates.filter((_, i) => i !== index));
  }

  function updateRate(index: number, field: keyof ShippingRateInput, value: unknown) {
    const updated = [...rates];
    updated[index] = { ...updated[index], [field]: value };
    setRates(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        countries: countries.trim(),
        regions: regions.trim() || null,
        priority: Number(priority),
        isActive,
        rates: rates.map((r) => ({
          name: r.name.trim(),
          method: r.method.trim().toUpperCase(),
          amount: Number(r.amount),
          freeShippingThreshold: r.freeShippingThreshold ? Number(r.freeShippingThreshold) : null,
          estimatedDeliveryText: r.estimatedDeliveryText ? r.estimatedDeliveryText.trim() : null,
          isActive: r.isActive,
        })),
      };

      const url = initialData ? `/api/admin/shipping/zones/${initialData.id}` : "/api/admin/shipping/zones";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save shipping zone.");

      router.push("/admin/shipping");
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
          href="/admin/shipping"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={16} /> Back to Shipping
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary)]/90 disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? "Saving..." : initialData ? "Update Shipping Zone" : "Create Shipping Zone"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Zone Info */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Zone Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              Zone Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dhaka City"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Country</label>
            <input
              type="text"
              required
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-700">
            Covered Cities / Districts (Comma separated)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Dhaka, Dhanmondi, Gulshan, Banani, Mirpur, Uttara (Leave blank for nationwide default)"
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-700">Priority Order</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value || "0", 10))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-stone-400">Higher priority matches customer location first.</p>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="zoneActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-stone-300 text-[var(--primary)]"
            />
            <label htmlFor="zoneActive" className="text-sm font-semibold text-stone-800">
              Zone Active
            </label>
          </div>
        </div>
      </div>

      {/* Rates Builder */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Shipping Rates</h2>
          <button
            type="button"
            onClick={addRate}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            <Plus size={16} /> Add Rate
          </button>
        </div>

        <div className="space-y-4">
          {rates.map((rate, idx) => (
            <div key={idx} className="relative rounded-xl border border-stone-200 p-4 space-y-3 bg-stone-50/50">
              {rates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRate(idx)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Rate Name</label>
                  <input
                    type="text"
                    required
                    value={rate.name}
                    onChange={(e) => updateRate(idx, "name", e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Method Code</label>
                  <input
                    type="text"
                    required
                    value={rate.method}
                    onChange={(e) => updateRate(idx, "method", e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-mono uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Amount (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rate.amount}
                    onChange={(e) => updateRate(idx, "amount", parseFloat(e.target.value || "0"))}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Free Shipping Threshold (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2000 (Optional)"
                    value={rate.freeShippingThreshold ?? ""}
                    onChange={(e) =>
                      updateRate(
                        idx,
                        "freeShippingThreshold",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Est. Delivery Text</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-2 business days"
                    value={rate.estimatedDeliveryText ?? ""}
                    onChange={(e) => updateRate(idx, "estimatedDeliveryText", e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
