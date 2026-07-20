"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Filter } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export function AdminOrdersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "ALL");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") ?? "ALL");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "createdAt_desc");

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val && val !== "ALL") {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1"); // Reset to page 1 on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("ALL");
    setPaymentStatus("ALL");
    setStartDate("");
    setEndDate("");
    setSort("createdAt_desc");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="surface p-4 space-y-4 rounded-xl">
      <div className="flex items-center gap-2 font-bold text-sm text-[var(--primary)] mb-1">
        <Filter size={16} /> Filter & Search Orders
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
            placeholder="Search Order # or Customer..."
            className="pl-9"
          />
          <Search size={16} className="absolute left-3 top-3 text-[var(--muted)] pointer-events-none" />
        </div>

        {/* Order Status */}
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters({ status: e.target.value });
          }}
        >
          <option value="ALL">All Order Statuses</option>
          {Object.values(OrderStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        {/* Payment Status */}
        <Select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            applyFilters({ paymentStatus: e.target.value });
          }}
        >
          <option value="ALL">All Payment Statuses</option>
          {Object.values(PaymentStatus).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>

        {/* Sort */}
        <Select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            const [sortBy, sortOrder] = e.target.value.split("_");
            applyFilters({ sortBy, sortOrder });
          }}
        >
          <option value="createdAt_desc">Date: Newest First</option>
          <option value="createdAt_asc">Date: Oldest First</option>
          <option value="grandTotal_desc">Total: High to Low</option>
          <option value="grandTotal_asc">Total: Low to High</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--muted)]">Date Range:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              applyFilters({ startDate: e.target.value });
            }}
            className="h-8 text-xs w-36"
          />
          <span className="text-[var(--muted)]">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              applyFilters({ endDate: e.target.value });
            }}
            className="h-8 text-xs w-36"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="gap-1 text-xs"
          >
            <RotateCcw size={14} /> Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => applyFilters({ search })}
            disabled={isPending}
            className="text-xs"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
