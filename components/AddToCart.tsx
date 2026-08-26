"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/catalog";

export function AddToCart({
  product,
  sizes,
}: {
  product: Product;
  sizes: string[];
}) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(
    sizes.length === 0 ? "One size" : null,
  );
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);

  function handleAdd() {
    if (size === null) {
      setError(true);
      return;
    }
    add({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
      size,
    });
    setError(false);
    setAdded(true);
  }

  return (
    <div className="mt-8">
      {sizes.length > 0 && (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-bone-dim">
              Size (US)
            </h2>
            {error && (
              <span className="text-sm text-ember">Pick a size first</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={size === option}
                onClick={() => {
                  setSize(option);
                  setError(false);
                  setAdded(false);
                }}
                className={`h-11 min-w-14 rounded-lg border px-2 text-sm font-medium transition ${
                  size === option
                    ? "border-ember bg-ember text-bone"
                    : "border-white/15 text-bone-dim hover:border-white/40 hover:text-bone"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-ember px-6 py-3 font-semibold text-bone transition hover:bg-ember-dark"
        >
          Add to cart
        </button>
        {added && (
          <p className="text-sm text-bone-dim" role="status">
            Added.{" "}
            <Link
              href="/cart"
              className="text-gold underline underline-offset-4"
            >
              Go to cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
