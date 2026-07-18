"use client";
import Link from "next/link";
import { Heart, Search, ShoppingCart, UserRound } from "lucide-react";
import type { Session } from "next-auth";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Navbar } from "./navbar";
import { MobileMenu } from "./mobile-menu";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";
export function SiteHeader({ session }: { session?: Session | null }) {
  const { itemCount } = useCart();
  const { items } = useWishlist();
  const accountLabel = session?.user?.name?.split(" ")[0] ?? "Account";
  const actions = [
    { label: "Search", href: "/plants", Icon: Search, count: 0 },
    { label: accountLabel, href: "/account", Icon: UserRound, count: 0 },
    { label: "Wishlist", href: "/wishlist", Icon: Heart, count: items.length },
    { label: "Cart", href: "/cart", Icon: ShoppingCart, count: itemCount },
  ];
  return (
    <header className="sticky top-0 z-40 border-b bg-[color:var(--surface)]/95 shadow-[0_8px_30px_rgb(30_90_58_/_0.04)] backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-18 lg:gap-6">
        <Logo />
        <Navbar />
        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {actions.map(({ label, href, Icon, count }) => (
              <Link
                className="relative grid size-10 place-items-center rounded-xl text-[var(--text)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
                href={href}
                aria-label={`${label}${count ? ` (${count})` : ""}`}
                key={label}
              >
                <Icon size={20} />
                {count > 0 && (
                  <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            ))}
          </div>
          {session?.user && (
            <span className="hidden max-w-28 truncate px-2 text-sm font-medium text-[var(--primary)] xl:inline">
              {accountLabel}
            </span>
          )}
          <MobileMenu session={session} />
        </div>
      </Container>
    </header>
  );
}
