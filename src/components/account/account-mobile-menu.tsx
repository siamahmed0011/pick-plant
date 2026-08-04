"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Heart, House, LogOut, MapPin, Menu, Package, ShieldCheck, UserRound } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Overview", href: "/account", Icon: House },
  { label: "Profile", href: "/account/profile", Icon: UserRound },
  { label: "Orders", href: "/account/orders", Icon: Package },
  { label: "Addresses", href: "/account/addresses", Icon: MapPin },
  { label: "Wishlist", href: "/account/wishlist", Icon: Heart },
  { label: "Security", href: "/account/security", Icon: ShieldCheck },
];

export function AccountMobileMenu({ customerName }: { customerName?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const activeItem = navigationItems.find(
    (item) => (item.href === "/account" ? pathname === item.href : pathname.startsWith(item.href))
  ) || navigationItems[0];

  return (
    <div className="lg:hidden mb-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-left hover:bg-[#F5FAF6] transition"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#EAF5EE] text-[#1E5A3A] font-bold text-sm">
            {(customerName ?? "C").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A877F]">Account Section</p>
            <p className="text-sm font-bold text-[#1F2D22] flex items-center gap-2">
              <activeItem.Icon size={16} className="text-[#1E5A3A]" />
              {activeItem.label}
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1E5A3A] bg-[#EEF5F0] px-3 py-1.5 rounded-[14px] border border-[#DDE7DD]">
          <Menu size={14} /> Menu
        </span>
      </button>

      <Drawer open={open} title="Account Menu" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[#DDE7DD] bg-[#EEF5F0] p-3 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#1E5A3A] text-white font-bold text-sm">
              {(customerName ?? "C").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1F2D22] truncate">{customerName ?? "Customer"}</p>
              <p className="text-xs text-[#66746A]">Manage your plant account</p>
            </div>
          </div>

          <nav className="grid gap-1" aria-label="Mobile account navigation">
            {navigationItems.map(({ label, href, Icon }) => {
              const active = href === "/account" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition border-l-4",
                    active
                      ? "bg-[#EEF5F0] text-[#1E5A3A] border-[#1E5A3A]"
                      : "border-transparent text-[#1F2D22] hover:bg-[#F5FAF6]"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} className={active ? "text-[#1E5A3A]" : "text-[#7A877F]"} />
                    {label}
                  </span>
                  <ChevronRight size={16} className="text-stone-400" />
                </Link>
              );
            })}

            <div className="pt-2 border-t border-[#DDE7DD] mt-2">
              <form action={signOutAction}>
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition text-left"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      </Drawer>
    </div>
  );
}
