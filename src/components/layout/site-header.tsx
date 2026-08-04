"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Heart,
  LogOut,
  Package,
  Search,
  ShoppingCart,
  User,
  UserRound,
} from "lucide-react";
import type { Session } from "next-auth";
import { signOutAction } from "@/app/(auth)/actions";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Navbar } from "./navbar";
import { MobileMenu } from "./mobile-menu";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";

export function SiteHeader({ session }: { session?: Session | null }) {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const firstName = user?.name ? user.name.split(" ")[0] : "Account";

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-[color:var(--surface)]/95 shadow-[0_8px_30px_rgb(30_90_58_/_0.04)] backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-18 lg:gap-6">
        <Logo />
        <Navbar />

        <div className="flex items-center gap-2">
          {/* Quick Action Icons */}
          <div className="hidden items-center gap-1 sm:flex">
            <Link
              className="relative grid size-10 place-items-center rounded-xl text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
              href="/plants"
              aria-label="Search plants"
            >
              <Search size={20} />
            </Link>

            <Link
              className="relative grid size-10 place-items-center rounded-xl text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
              href="/wishlist"
              aria-label={`Wishlist${wishlistItems.length ? ` (${wishlistItems.length})` : ""}`}
            >
              <Heart size={20} />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link
              className="relative grid size-10 place-items-center rounded-xl text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
              href="/cart"
              aria-label={`Cart${itemCount ? ` (${itemCount})` : ""}`}
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Cart Icon */}
          <Link
            className="relative grid size-10 place-items-center rounded-xl text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] sm:hidden"
            href="/cart"
            aria-label={`Cart${itemCount ? ` (${itemCount})` : ""}`}
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Desktop Authentication Section */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border)]">
            {user ? (
              // Authenticated User Menu Dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-[var(--muted-surface)] text-[var(--primary)] font-bold text-xs">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate">{firstName}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
                    <div className="border-b border-[var(--border)] px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Signed in as</p>
                      <p className="truncate text-sm font-bold text-[var(--text)]">{user.name ?? "Customer"}</p>
                      {user.email && <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
                      >
                        <User size={16} /> My Account
                      </Link>

                      <Link
                        href="/account#orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
                      >
                        <Package size={16} /> Orders
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
                      >
                        <Heart size={16} /> Wishlist ({wishlistItems.length})
                      </Link>
                    </div>

                    <div className="border-t border-[var(--border)] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          signOutAction();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Guest User Desktop Navigation Entry Points
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] transition"
                >
                  <UserRound size={16} /> Create account
                </Link>
              </div>
            )}
          </div>

          <MobileMenu session={session} />
        </div>
      </Container>
    </header>
  );
}
