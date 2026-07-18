"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Product } from "@/types";

type WishlistContext = {
  items: Product[];
  hydrated: boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};
const Context = createContext<WishlistContext | null>(null);
const key = "pick-plant-wishlist";
const changeEvent = `${key}-change`;
const serverSnapshot: Product[] = [];
let cachedRaw: string | null | undefined;
let cachedItems: Product[] = serverSnapshot;

function getSnapshot() {
  try {
    const raw = localStorage.getItem(key);
    if (raw === cachedRaw) return cachedItems;
    const stored: unknown = JSON.parse(raw ?? "[]");
    cachedRaw = raw;
    cachedItems = Array.isArray(stored) ? stored : [];
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

function updateItems(update: (current: Product[]) => Product[]) {
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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const toggle = (product: Product) =>
    updateItems((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product]
    );
  const value: WishlistContext = {
    items,
    hydrated,
    toggle,
    remove: (id) => updateItems((current) => current.filter((item) => item.id !== id)),
    clear: () => updateItems(() => []),
    has: (id) => items.some((item) => item.id === id),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWishlist() {
  const value = useContext(Context);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
