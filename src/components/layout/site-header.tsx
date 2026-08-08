"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
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

import { signOutAction } from "@/app/(auth)/actions";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";

import { MobileMenu } from "./mobile-menu";
import { Navbar } from "./navbar";

type SiteHeaderProps = {
  session?: Session | null;
};

export function SiteHeader({ session }: SiteHeaderProps) {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const firstName = user?.name?.trim()
    ? user.name.trim().split(/\s+/)[0]
    : "Account";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSignOut() {
    setDropdownOpen(false);
    void signOutAction();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:var(--surface)]/95 shadow-[0_8px_30px_rgb(30_90_58_/_0.04)] backdrop-blur-md">
      <Container className="flex h-16 flex-nowrap items-center gap-2 sm:h-[72px] lg:gap-3 xl:gap-4">
        {/* Logo */}
        <div className="shrink-0 whitespace-nowrap">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <Navbar />
        </div>

        {/* Header Actions */}
        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5 xl:gap-2">
          {/* Desktop Quick Actions */}
          <div className="hidden shrink-0 items-center gap-0.5 md:flex">
            <Link
              href="/plants"
              aria-label="Search plants"
              className="relative grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] xl:size-10"
            >
              <Search aria-hidden="true" size={19} />
            </Link>

            <Link
              href="/wishlist"
              aria-label={
                wishlistItems.length
                  ? `Wishlist (${wishlistItems.length})`
                  : "Wishlist"
              }
              className="relative grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] xl:size-10"
            >
              <Heart aria-hidden="true" size={19} />

              {wishlistItems.length > 0 && (
                <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label={itemCount ? `Cart (${itemCount})` : "Cart"}
              className="relative grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] xl:size-10"
            >
              <ShoppingCart aria-hidden="true" size={19} />

              {itemCount > 0 && (
                <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Cart */}
          <Link
            href="/cart"
            aria-label={itemCount ? `Cart (${itemCount})` : "Cart"}
            className="relative grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] md:hidden"
          >
            <ShoppingCart aria-hidden="true" size={19} />

            {itemCount > 0 && (
              <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Desktop Authentication */}
          <div className="hidden shrink-0 flex-nowrap items-center gap-1 border-l border-[var(--border)] pl-2 lg:flex xl:gap-1.5">
            {user ? (
              <div ref={dropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((current) => !current)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] xl:gap-2 xl:px-3 xl:text-sm"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--muted-surface)] text-xs font-bold text-[var(--primary)] xl:size-7">
                    {firstName.charAt(0).toUpperCase()}
                  </span>

                  <span className="max-w-20 truncate whitespace-nowrap xl:max-w-24">
                    {firstName}
                  </span>

                  <ChevronDown
                    aria-hidden="true"
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-[240px] space-y-1 rounded-[18px] border border-[#DDE7DD] bg-white p-2 shadow-[0_8px_24px_rgba(31,45,34,0.10)] animate-in fade-in-50 zoom-in-95"
                  >
                    <Link
                      role="menuitem"
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-sm font-semibold text-[#1F2D22] transition-colors hover:bg-[#F5FAF6] hover:text-[#1E5A3A]"
                    >
                      <User
                        aria-hidden="true"
                        size={16}
                        className="shrink-0 text-[#1E5A3A]"
                      />
                      <span>My Account</span>
                    </Link>

                    <Link
                      role="menuitem"
                      href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-sm font-semibold text-[#1F2D22] transition-colors hover:bg-[#F5FAF6] hover:text-[#1E5A3A]"
                    >
                      <Package
                        aria-hidden="true"
                        size={16}
                        className="shrink-0 text-[#1E5A3A]"
                      />
                      <span>Orders</span>
                    </Link>

                    <Link
                      role="menuitem"
                      href="/wishlist"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between whitespace-nowrap rounded-[12px] px-3 py-2.5 text-sm font-semibold text-[#1F2D22] transition-colors hover:bg-[#F5FAF6] hover:text-[#1E5A3A]"
                    >
                      <span className="flex items-center gap-2.5 whitespace-nowrap">
                        <Heart
                          aria-hidden="true"
                          size={16}
                          className="shrink-0 text-[#1E5A3A]"
                        />
                        <span>Wishlist</span>
                      </span>

                      {wishlistItems.length > 0 && (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#1E5A3A] text-[10px] font-bold text-white">
                          {wishlistItems.length}
                        </span>
                      )}
                    </Link>

                    <div className="border-t border-[#DDE7DD] pt-1">
                      <button
                        role="menuitem"
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut
                          aria-hidden="true"
                          size={16}
                          className="shrink-0"
                        />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex shrink-0 flex-nowrap items-center gap-1 xl:gap-1.5">
                <Link
                  href="/login"
                  className="shrink-0 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[13px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] xl:text-sm"
                >
                  Sign in
                </Link>

                <Link
                  href="/register"
                  className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-[var(--primary)] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] xl:text-sm"
                >
                  <UserRound
                    aria-hidden="true"
                    size={15}
                    className="shrink-0"
                  />
                  <span className="whitespace-nowrap">Create account</span>
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