"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface WishlistItem {
  kind: "master" | "supplier";
  id: number;
  slug: string;
  brand: string;
  name: string;
  price: number | null;
  currency: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  isWished: (kind: WishlistItem["kind"], id: number) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (kind: WishlistItem["kind"], id: number) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "dicey-shoes:wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const isWished: WishlistContextValue["isWished"] = (kind, id) =>
    items.some((i) => i.kind === kind && i.id === id);

  const toggle: WishlistContextValue["toggle"] = (item) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.kind === item.kind && i.id === item.id);
      return exists
        ? prev.filter((i) => !(i.kind === item.kind && i.id === item.id))
        : [...prev, item];
    });
  };

  const remove: WishlistContextValue["remove"] = (kind, id) =>
    setItems((prev) => prev.filter((i) => !(i.kind === kind && i.id === id)));

  return (
    <WishlistContext.Provider value={{ items, isWished, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
