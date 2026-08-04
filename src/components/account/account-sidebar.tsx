"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LogOut, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Overview", href: "/account", Icon: House },
  { label: "Profile", href: "/account/profile", Icon: UserRound },
  { label: "Orders", href: "/account/orders", Icon: Package },
  { label: "Addresses", href: "/account/addresses", Icon: MapPin },
  { label: "Wishlist", href: "/account/wishlist", Icon: Heart },
  { label: "Security", href: "/account/security", Icon: ShieldCheck },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full">
      <nav
        aria-label="Account navigation"
        className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-1"
      >
        <p className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#7A877F]">
          Account Menu
        </p>

        {navigationItems.map(({ label, href, Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 border-l-4",
                active
                  ? "bg-[#EEF5F0] text-[#1E5A3A] border-[#1E5A3A]"
                  : "border-transparent text-[#1F2D22] hover:bg-[#F5FAF6] hover:text-[#1E5A3A]"
              )}
            >
              <span className="flex items-center gap-3">
                <span className={cn(
                  "grid size-7 place-items-center rounded-lg transition-colors",
                  active ? "text-[#1E5A3A]" : "text-[#7A877F] group-hover:text-[#1E5A3A]"
                )}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </span>
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-[#DDE7DD]">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl border-l-4 border-transparent px-3.5 py-2.5 text-sm font-semibold text-[#66746A] hover:bg-stone-100 hover:text-stone-900 transition duration-150"
            >
              <span className="grid size-7 place-items-center rounded-lg text-[#7A877F]">
                <LogOut size={16} aria-hidden="true" />
              </span>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
