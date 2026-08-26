"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { useCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/products";

export default function CartPage() {
  const { lines, ready, count, subtotal, setQty, remove, clear } = useCart();
  const [placed, setPlaced] = useState(false);

  if (!ready) {
    return (
      <div className="py-20 text-center text-bone-dim">Loading your cart…</div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          {placed ? "Order placed." : "Your cart is empty."}
        </h1>
        <p className="max-w-md text-lg text-bone-dim">
          {placed
            ? "This is a demo storefront, so nothing is actually on its way. Roll again anyway."
            : "Nothing riding on this roll yet. Pick a piece, or let the die choose for you."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-xl bg-ember px-6 py-3 font-semibold text-bone transition hover:bg-ember-dark"
          >
            Shop all six
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10"
          >
            Roll the die
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="border-b border-white/10 pb-8">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your cart
        </h1>
        <p className="mt-3 text-bone-dim">
          {count} {count === 1 ? "item" : "items"}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <ul className="flex flex-col gap-4">
          {lines.map((line) => {
            const product = getProduct(line.slug);
            if (!product) return null;

            return (
              <li
                key={`${line.slug}-${line.size}`}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-felt-900 p-4 sm:flex-row sm:items-center"
              >
                <ProductArt product={product} className="h-24 w-full sm:w-40" />

                <div className="flex-1">
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-semibold tracking-tight transition hover:text-gold"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-bone-dim">
                    Size {line.size} · {product.colorway}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(line.slug, line.size)}
                    className="mt-2 text-sm text-bone-dim underline underline-offset-4 transition hover:text-ember"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-lg border border-white/15">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${product.name}`}
                      onClick={() => setQty(line.slug, line.size, line.qty - 1)}
                      className="h-9 w-9 text-lg text-bone-dim transition hover:text-bone"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-sm">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${product.name}`}
                      onClick={() => setQty(line.slug, line.size, line.qty + 1)}
                      className="h-9 w-9 text-lg text-bone-dim transition hover:text-bone"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right font-mono text-gold">
                    {formatPrice(product.price * line.qty)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-2xl border border-white/10 bg-felt-900 p-6">
          <h2 className="text-lg font-semibold tracking-tight">Summary</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-bone-dim">Subtotal</dt>
              <dd className="font-mono">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-bone-dim">Shipping</dt>
              <dd className="font-mono">Free</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-mono text-gold">{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => {
              clear();
              setPlaced(true);
            }}
            className="mt-6 w-full rounded-xl bg-ember px-6 py-3 font-semibold text-bone transition hover:bg-ember-dark"
          >
            Checkout
          </button>
          <p className="mt-3 text-center text-xs text-bone-dim">
            Demo storefront — checkout just clears the cart.
          </p>
        </aside>
      </div>
    </div>
  );
}
