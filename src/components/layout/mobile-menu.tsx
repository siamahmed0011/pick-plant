"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import { Heart, LogOut, Menu, Package, ShoppingCart, User, UserPlus, UserRound } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { mainNavigation } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";

export function MobileMenu({ session }: { session?: Session | null }) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  const user = session?.user;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open main menu"
        className="rounded-xl lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <Drawer open={open} title="Navigation" onClose={() => setOpen(false)}>
        <nav className="grid gap-2" aria-label="Mobile navigation">
          {/* User Status / Account Header Block */}
          {user ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted-surface)] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-white font-bold text-base">
                  {(user.name ?? "U").charAt(0).toUpperCase()}
                </span>
                <div className="truncate">
                  <p className="font-bold text-[var(--text)] truncate">{user.name ?? "Customer"}</p>
                  {user.email && <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]/60 text-sm font-semibold">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white p-2.5 text-[var(--text)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition"
                >
                  <User size={16} /> My Account
                </Link>
                <Link
                  href="/account#orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white p-2.5 text-[var(--text)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition"
                >
                  <Package size={16} /> Orders
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOutAction();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : (
            // Guest Options in Mobile Navigation
            <div className="grid grid-cols-2 gap-2 p-1">
              <Link
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-semibold text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
                href="/login"
                onClick={() => setOpen(false)}
              >
                <UserRound size={18} /> Sign in
              </Link>
              <Link
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition"
                href="/register"
                onClick={() => setOpen(false)}
              >
                <UserPlus size={18} /> Create account
              </Link>
            </div>
          )}

          {/* Quick Shortcuts */}
          <Link
            className="flex items-center justify-between rounded-xl px-4 py-3 font-medium hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
            href="/cart"
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center gap-3">
              <ShoppingCart size={20} />
              Cart
            </span>
            {itemCount > 0 && (
              <span className="grid min-w-5 h-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <Link
            className="flex items-center justify-between rounded-xl px-4 py-3 font-medium hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
            href="/wishlist"
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center gap-3">
              <Heart size={20} />
              Wishlist
            </span>
            {wishlistItems.length > 0 && (
              <span className="grid min-w-5 h-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-bold text-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <div className="border-t border-[var(--border)] my-1" />

          {/* Main Navigation Links */}
          {mainNavigation.map((item) => (
            <Link
              className="rounded-xl px-4 py-3 font-medium hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
