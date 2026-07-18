"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Leaf } from "lucide-react";
import { adminNavigation, isAdminNavigationActive } from "@/config/admin-navigation";
import { AdminNavItem } from "./admin-nav-item";

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Admin sidebar"
      className="flex h-full flex-col overflow-y-auto bg-[var(--primary)] p-4 text-white"
    >
      <div>
        <Link
          href="/admin"
          onClick={onNavigate}
          className="mb-8 flex items-center gap-3 rounded-xl px-2 py-2 text-lg font-bold tracking-[-0.02em] focus-visible:outline-white"
          aria-label="Pick Plant admin dashboard"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
            <Leaf size={20} aria-hidden="true" />
          </span>
          <span>
            Pick Plant
            <span className="block text-xs font-medium tracking-normal text-white/65">Admin workspace</span>
          </span>
        </Link>
        <nav aria-label="Admin navigation" className="grid gap-1.5">
          {adminNavigation.map((item) => (
            <AdminNavItem
              item={item}
              active={isAdminNavigationActive(pathname, item.href)}
              onNavigate={onNavigate}
              key={item.href}
            />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/15 pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
        >
          View storefront
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <p className="mt-3 px-3 text-xs leading-5 text-white/50">Secure administrator access</p>
      </div>
    </aside>
  );
}
