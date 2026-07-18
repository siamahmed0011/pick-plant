"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LogOut, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/account", Icon: House },
  { label: "Profile", href: "/account/profile", Icon: UserRound },
  { label: "Security", href: "/account/security", Icon: ShieldCheck },
  { label: "Orders", href: "/account/orders", Icon: Package },
  { label: "Addresses", href: "/account/addresses", Icon: MapPin },
  { label: "Wishlist", href: "/account/wishlist", Icon: Heart },
];

export function AccountSidebar() {
  const pathname = usePathname();
  return (
    <aside className="surface p-3">
      <nav aria-label="Account navigation" className="flex gap-1 overflow-x-auto lg:grid">
        {items.map(({ label, href, Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]",
                active && "bg-[var(--muted-surface)] text-[var(--primary)]"
              )}
              href={href}
              key={href}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start whitespace-nowrap text-sm"
          >
            <LogOut size={17} aria-hidden="true" />
            Sign out
          </Button>
        </form>
      </nav>
    </aside>
  );
}
