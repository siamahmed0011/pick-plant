"use client";
import { CartProvider } from "./cart-provider";
import { WishlistProvider } from "./wishlist-provider";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  );
}
