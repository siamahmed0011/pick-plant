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
    <nav
      aria-label="Main navigation"
      className="hidden shrink-0 flex-nowrap items-center gap-0.5 lg:flex xl:gap-1"
    >
      {mainNavigation.map((item) =>
        item.children ? (
          <details
            className="group relative shrink-0 whitespace-nowrap"
            key={item.href}
          >
            <summary
              className={cn(
                "flex shrink-0 cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--muted-surface)] xl:px-2.5 xl:py-2 xl:text-sm",
                pathname.startsWith(item.href) &&
                  "bg-[var(--background)] font-semibold text-[var(--primary)]"
              )}
            >
              <span className="shrink-0 whitespace-nowrap">{item.label}</span>
              <ChevronDown
                aria-hidden="true"
                className="shrink-0"
                size={14}
              />
            </summary>

            <div className="surface absolute left-0 top-full z-40 mt-2 w-80 p-3">
              <CategoryMenu />
            </div>
          </details>
        ) : (
          <Link
            className={cn(
              "shrink-0 whitespace-nowrap rounded-xl px-2 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--muted-surface)] xl:px-2.5 xl:py-2 xl:text-sm",
              pathname === item.href &&
                "bg-[var(--background)] font-semibold text-[var(--primary)]"
            )}
            href={item.href}
            key={item.href}
          >
            <span className="shrink-0 whitespace-nowrap">{item.label}</span>
          </Link>
        )
      )}
    </nav>
  );
}