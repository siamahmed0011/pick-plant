"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { CategoryMenu } from "./category-menu";
import { cn } from "@/lib/utils";
export function Navbar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
      {mainNavigation.map((item) =>
        item.children ? (
          <details className="group relative" key={item.href}>
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--muted-surface)]",
                pathname.startsWith(item.href) && "bg-[var(--background)] text-[var(--primary)]"
              )}
            >
              <span>{item.label}</span>
              <ChevronDown size={14} />
            </summary>
            <div className="surface absolute left-0 top-full z-40 mt-2 w-80 p-3">
              <CategoryMenu />
            </div>
          </details>
        ) : (
          <Link
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--muted-surface)]",
              pathname === item.href && "bg-[var(--background)] font-semibold text-[var(--primary)]"
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}
