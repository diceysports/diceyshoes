"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { formatMoney } from "@/lib/utils/price";

export default function CartPage() {
  const { items, removeItem, setQty, subtotal } = useCart();

  return (
    <section className="mx-auto max-w-[900px] px-5 py-14 md:px-8">
      <h1 className="font-display mb-10 text-[clamp(32px,5vw,48px)] uppercase leading-none">
        Your Bag
      </h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-10 py-16 text-center">
          <p className="mb-6 text-sm text-fog">Your bag is empty.</p>
          <Link
            href="/shop"
            className="inline-block rounded-full bg-paper px-6 py-3 text-xs font-bold uppercase tracking-wide text-ink hover:bg-accent hover:text-white"
          >
            Browse The Catalog
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-line border-t border-line">
            {items.map((item, idx) => (
              <div key={`${item.kind}-${item.id}-${item.size}-${idx}`} className="flex items-center gap-5 py-6">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-line">
                  <ProductPlaceholder brand={item.brand} size="sm" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-fog">{item.brand}</div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="mt-1 text-xs text-fog">Size {item.size}</div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => setQty(idx, Number(e.target.value))}
                  className="w-16 rounded-lg border border-line bg-transparent px-2 py-1.5 text-center text-sm"
                />
                <div className="w-24 text-right text-sm font-bold">
                  {formatMoney(item.price * item.qty, item.currency)}
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="text-xs font-semibold uppercase text-fog underline hover:text-paper"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-end gap-4 border-t border-line pt-8">
            <div className="flex w-full max-w-xs justify-between text-sm">
              <span className="text-fog">Subtotal</span>
              <span className="text-lg font-bold">{formatMoney(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              className="w-full max-w-xs rounded-full bg-paper py-4 text-center text-xs font-bold uppercase tracking-wide text-ink hover:bg-accent hover:text-white"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
