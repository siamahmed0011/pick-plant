"use client";

import Link from "next/link";
import { Plus, Truck, Edit, MapPin } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type ShippingRateItem = {
  id: string;
  name: string;
  method: string;
  amount: number;
  freeShippingThreshold: number | null;
  estimatedDeliveryText: string | null;
  isActive: boolean;
};

type ShippingZoneItem = {
  id: string;
  name: string;
  countries: string;
  regions: string | null;
  priority: number;
  isActive: boolean;
  rates: ShippingRateItem[];
};

export function AdminShippingView({ zones }: { zones: ShippingZoneItem[] }) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <AdminPageHeader
          title="Shipping Zones & Rates"
          description="Configure Bangladesh shipping zones, courier rates, free shipping thresholds, and estimated delivery dates."
          status={null}
        />
        <Link
          href="/admin/shipping/zones/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-semibold text-white shadow-sm transition hover:bg-[var(--primary)]/90"
        >
          <Plus size={18} aria-hidden="true" /> Add Shipping Zone
        </Link>
      </div>

      <div className="grid gap-6">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            {/* Zone Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-stone-200 bg-stone-50 p-4 sm:px-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <MapPin size={18} className="text-[var(--primary)]" />
                  {zone.name}
                  {zone.isActive ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  Priority: <span className="font-semibold text-stone-700">{zone.priority}</span> | Regions:{" "}
                  <span className="font-semibold text-stone-700">{zone.regions || "Nationwide Default"}</span>
                </p>
              </div>
              <Link
                href={`/admin/shipping/zones/${zone.id}/edit`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                <Edit size={14} /> Edit Zone
              </Link>
            </div>

            {/* Rates Table */}
            <div className="divide-y divide-stone-100">
              {zone.rates.map((rate) => (
                <div key={rate.id} className="flex flex-wrap items-center justify-between p-4 sm:px-6">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                      <Truck size={16} className="text-stone-400" />
                      {rate.name}
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono font-bold text-stone-600">
                        {rate.method}
                      </span>
                    </div>
                    {rate.estimatedDeliveryText && (
                      <p className="text-xs text-stone-500">
                        Est. Delivery: {rate.estimatedDeliveryText}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-stone-900">৳ {rate.amount}</span>
                    {rate.freeShippingThreshold && (
                      <span className="block text-xs text-emerald-700 font-medium">
                        Free on orders ≥ ৳ {rate.freeShippingThreshold}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
