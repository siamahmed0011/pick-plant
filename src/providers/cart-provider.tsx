"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/types";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  bengaliName: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  selectedSize: string;
  selectedPot: string;
};
type CartContext = {
  items: CartItem[];
  hydrated: boolean;
  addItem: (product: Product, quantity?: number, size?: string, pot?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const Context = createContext<CartContext | null>(null);
const key = "pick-plant-cart";
const changeEvent = `${key}-change`;
const serverSnapshot: CartItem[] = [];
let cachedRaw: string | null | undefined;
let cachedItems: CartItem[] = serverSnapshot;

function getSnapshot() {
  try {
    const raw = localStorage.getItem(key);
    if (raw === cachedRaw) return cachedItems;
    const stored: unknown = JSON.parse(raw ?? "[]");
    cachedRaw = raw;
    cachedItems = Array.isArray(stored)
      ? stored.filter(
          (item): item is CartItem =>
            Boolean(item) && typeof item === "object" && "id" in item && typeof item.id === "string"
        )
      : [];
    return cachedItems;
  } catch {
    cachedRaw = null;
    cachedItems = [];
    return cachedItems;
  }
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

function updateItems(update: (current: CartItem[]) => CartItem[]) {
  const items = update(getSnapshot());
  const raw = JSON.stringify(items);
  localStorage.setItem(key, raw);
  cachedRaw = raw;
  cachedItems = items;
  window.dispatchEvent(new Event(changeEvent));
}

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const value = useMemo<CartContext>(
    () => ({
      items,
      hydrated,
      addItem: (product, quantity = 1, size = "Medium", pot = "Nursery Pot") =>
        updateItems((current) => {
          const id = `${product.id}-${size}-${pot}`;
          const existing = current.find((item) => item.id === id);
          if (existing)
            return current.map((item) =>
              item.id === id
                ? { ...item, quantity: Math.min(item.stock, item.quantity + quantity) }
                : item
            );
          return [
            ...current,
            {
              id,
              productId: product.id,
              slug: product.slug,
              name: product.name,
              bengaliName: product.bengaliName,
              image: product.image,
              price: product.salePrice ?? product.regularPrice,
              quantity: Math.min(product.stock, quantity),
              stock: product.stock,
              selectedSize: size,
              selectedPot: pot,
            },
          ];
        }),
      removeItem: (id) => updateItems((current) => current.filter((item) => item.id !== id)),
      updateQuantity: (id, quantity) =>
        updateItems((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) }
              : item
          )
        ),
      clearCart: () => updateItems(() => []),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    [items, hydrated]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
