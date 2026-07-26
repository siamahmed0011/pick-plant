"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, TicketPercent, CheckCircle2, XCircle, Edit } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type CouponItem = {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  redemptionsCount: number;
};

export function AdminCouponsView({ coupons: initialCoupons }: { coupons: CouponItem[] }) {
  const [coupons] = useState(initialCoupons);
  const [search, setSearch] = useState("");

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <AdminPageHeader
          title="Coupons Management"
          description="Create, manage, and monitor discount coupon codes and customer redemptions."
          status={null}
        />
        <Link
          href="/admin/coupons/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-semibold text-white shadow-sm transition hover:bg-[var(--primary)]/90"
        >
          <Plus size={18} aria-hidden="true" /> Create Coupon
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
        <Search size={18} className="text-stone-400" />
        <input
          type="text"
          placeholder="Search by coupon code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-700">
              <tr>
                <th className="px-6 py-4">Code & Name</th>
                <th className="px-6 py-4">Discount Type</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Min. Subtotal</th>
                <th className="px-6 py-4">Redemptions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                    <TicketPercent className="mx-auto mb-2 text-stone-300" size={32} />
                    <p className="font-medium">No coupons found.</p>
                    <p className="text-xs text-stone-400">
                      Create your first promotion coupon to drive customer sales.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-[var(--primary)]">{coupon.code}</div>
                      <div className="text-xs text-stone-500">{coupon.name}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-700">
                      {coupon.type === "PERCENTAGE" && "Percentage Discount"}
                      {coupon.type === "FIXED_AMOUNT" && "Fixed Amount"}
                      {coupon.type === "FREE_SHIPPING" && "Free Shipping"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `৳ ${coupon.value}`}
                      {coupon.maximumDiscountAmount && (
                        <span className="block text-xs font-normal text-stone-400">
                          Max: ৳ {coupon.maximumDiscountAmount}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {coupon.minimumOrderAmount ? `৳ ${coupon.minimumOrderAmount}` : "None"}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      <span className="font-medium text-stone-900">{coupon.usedCount}</span>
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " (Unlimited)"}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          <XCircle size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/coupons/${coupon.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-[var(--primary)]"
                      >
                        <Edit size={14} /> Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
