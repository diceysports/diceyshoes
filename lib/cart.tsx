"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "./products";

export type CartLine = {
  slug: string;
  size: number;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  /** False until the stored cart has been read, so the UI can avoid a hydration flash. */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (slug: string, size: number, qty?: number) => void;
  setQty: (slug: string, size: number, qty: number) => void;
  remove: (slug: string, size: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "diceyshoes.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === "string" &&
    typeof line.size === "number" &&
    typeof line.qty === "number" &&
    line.qty > 0 &&
    getProduct(line.slug) !== undefined
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        setLines(parsed.filter(isCartLine));
      }
    } catch {
      // A corrupt or unavailable store just means an empty cart.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private browsing and blocked storage keep the cart in memory only.
    }
  }, [lines, ready]);

  const add = useCallback((slug: string, size: number, qty = 1) => {
    if (!getProduct(slug)) return;
    setLines((current) => {
      const match = current.find((line) => line.slug === slug && line.size === size);
      if (!match) return [...current, { slug, size, qty }];
      return current.map((line) =>
        line === match ? { ...line, qty: Math.min(line.qty + qty, 99) } : line,
      );
    });
  }, []);

  const setQty = useCallback((slug: string, size: number, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((line) => !(line.slug === slug && line.size === size))
        : current.map((line) =>
            line.slug === slug && line.size === size
              ? { ...line, qty: Math.min(qty, 99) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((slug: string, size: number) => {
    setLines((current) =>
      current.filter((line) => !(line.slug === slug && line.size === size)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.qty, 0);
    const subtotal = lines.reduce((total, line) => {
      const product = getProduct(line.slug);
      return product ? total + product.price * line.qty : total;
    }, 0);
    return { lines, ready, count, subtotal, add, setQty, remove, clear };
  }, [lines, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}
