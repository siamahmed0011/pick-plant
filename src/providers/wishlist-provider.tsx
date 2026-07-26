"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidWishlistItem(item: unknown): item is Product {
  if (!item || typeof item !== "object") return false;
  const i = item as Record<string, unknown>;
  return typeof i.id === "string" && UUID_REGEX.test(i.id);
}

function getSnapshot() {
  try {
    const raw = localStorage.getItem(key);
    if (raw === cachedRaw) return cachedItems;
    const stored: unknown = JSON.parse(raw ?? "[]");
    cachedRaw = raw;
    if (Array.isArray(stored)) {
      const valid = stored.filter(isValidWishlistItem);
      if (valid.length !== stored.length) {
        localStorage.setItem(key, JSON.stringify(valid));
      }
      cachedItems = valid;
    } else {
      cachedItems = [];
    }
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

  // Sync DB wishlist on initial load for authenticated users
  useEffect(() => {
    async function syncFromDatabase() {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            updateItems((current) => {
              const combined = [...current];
              data.items.forEach((dbItem: Product) => {
                if (!combined.some((item) => item.id === dbItem.id)) {
                  combined.push(dbItem);
                }
              });
              return combined;
            });
          }
        }
      } catch {
        // Silently fallback to LocalStorage
      }
    }
    syncFromDatabase();
  }, []);

  const toggle = (product: Product) => {
    updateItems((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product]
    );

    // Sync to DB in background
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => undefined);
  };

  const remove = (id: string) => {
    updateItems((current) => current.filter((item) => item.id !== id));
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    }).catch(() => undefined);
  };

  const clear = () => {
    updateItems(() => []);
    fetch("/api/wishlist", { method: "DELETE" }).catch(() => undefined);
  };

  const value: WishlistContext = {
    items,
    hydrated,
    toggle,
    remove,
    clear,
    has: (id) => items.some((item) => item.id === id),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWishlist() {
  const value = useContext(Context);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
