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

/**
 * Cart lines carry a snapshot of the product rather than just an id.
 *
 * The catalog lives in Supabase and is read in server components, so the
 * client-side cart cannot look a product back up. Snapshotting name, price and
 * image at add-time also means a later catalog edit never silently rewrites
 * what someone already put in their bag.
 */
export type CartLine = {
  id: number;
  slug: string;
  name: string;
  /** Price in US cents at the time it was added. */
  price: number;
  currency: string;
  imageUrl: string | null;
  size: string;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  /** False until the stored cart has been read, so the UI can avoid a flash. */
  ready: boolean;
  count: number;
  subtotal: number;
  currency: string;
  add: (item: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "diceyshoes.cart.v2";

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === "string" &&
    typeof line.name === "string" &&
    typeof line.size === "string" &&
    typeof line.price === "number" &&
    typeof line.qty === "number" &&
    line.qty > 0
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setLines(parsed.filter(isCartLine));
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
      // Private browsing keeps the cart in memory only.
    }
  }, [lines, ready]);

  const add = useCallback((item: Omit<CartLine, "qty">, qty = 1) => {
    setLines((current) => {
      const match = current.find(
        (line) => line.slug === item.slug && line.size === item.size,
      );
      if (!match) return [...current, { ...item, qty }];
      return current.map((line) =>
        line === match ? { ...line, qty: Math.min(line.qty + qty, 99) } : line,
      );
    });
  }, []);

  const setQty = useCallback((slug: string, size: string, qty: number) => {
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

  const remove = useCallback((slug: string, size: string) => {
    setLines((current) =>
      current.filter((line) => !(line.slug === slug && line.size === size)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.qty, 0);
    const subtotal = lines.reduce(
      (total, line) => total + line.price * line.qty,
      0,
    );
    return {
      lines,
      ready,
      count,
      subtotal,
      currency: lines[0]?.currency ?? "USD",
      add,
      setQty,
      remove,
      clear,
    };
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
