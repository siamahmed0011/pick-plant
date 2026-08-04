"use client";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "./cart-provider";
import { WishlistProvider } from "./wishlist-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
    </AuthSessionProvider>
  );
}
