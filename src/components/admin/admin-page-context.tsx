"use client";

import { usePathname } from "next/navigation";
import { getActiveAdminNavigation } from "@/config/admin-navigation";

export function AdminPageContext() {
  const pathname = usePathname();
  const activeItem = getActiveAdminNavigation(pathname);

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-[var(--text)]">
        {activeItem?.label ?? "Admin workspace"}
      </p>
      <p className="hidden text-xs text-[var(--muted)] sm:block">Pick Plant store administration</p>
    </div>
  );
}
