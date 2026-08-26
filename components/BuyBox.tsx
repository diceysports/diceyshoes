"use client";

import { useState } from "react";
import type { MasterProduct, StockStatus } from "@/lib/types";
import { SizeSelector } from "./SizeSelector";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export function BuyBox({ product, stock }: { product: MasterProduct; stock: StockStatus }) {
  const [size, setSize] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { addItem } = useCart();
  const { isWished, toggle } = useWishlist();

  const wished = isWished("master", product.productId);
  const canBuy = stock.state === "IN_STOCK" || stock.state === "LOW_STOCK";

  function handleAdd() {
    if (!size) {
      setMessage("Select a size first.");
      return;
    }
    addItem({
      kind: "master",
      id: product.productId,
      slug: product.slug,
      brand: product.brand.name,
      name: product.name,
      size,
      price: product.price.amount ?? 0,
      currency: product.price.currency,
      isDemo: false,
    });
    setMessage("Added to bag");
  }

  return (
    <div>
      <div className="mb-6">
        <AvailabilityBadge state={stock.state} />
        {stock.state === "COMING_SOON" && (
          <p className="mt-2 text-xs leading-relaxed text-fog">
            This release isn&apos;t available to purchase yet — check the release calendar for
            the drop date.
          </p>
        )}
        {stock.state === "SOLD_OUT" && (
          <p className="mt-2 text-xs leading-relaxed text-fog">
            This one&apos;s sold out. Save it to your wishlist to know if it comes back.
          </p>
        )}
      </div>

      {canBuy && stock.sizes && (
        <>
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide">
            <span>Select Size — US {product.gender ?? "UNISEX"}</span>
            <button className="font-normal normal-case text-fog underline">Size Guide</button>
          </div>
          <SizeSelector sizes={stock.sizes} onSelect={setSize} />
        </>
      )}

      <div className="mb-8 flex gap-3">
        {canBuy ? (
          <button
            onClick={handleAdd}
            className="flex-1 rounded-full bg-paper py-4 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-accent"
          >
            Add to Bag
          </button>
        ) : (
          <button
            onClick={() => setMessage("You'll be notified when this product becomes available.")}
            className="flex-1 rounded-full border border-paper/30 py-4 text-xs font-bold uppercase tracking-wide hover:border-paper"
          >
            Notify Me
          </button>
        )}
        <button
          onClick={() =>
            toggle({
              kind: "master",
              id: product.productId,
              slug: product.slug,
              brand: product.brand.name,
              name: product.name,
              price: product.price.amount,
              currency: product.price.currency,
            })
          }
          className="rounded-full border border-paper/30 px-6 text-xs font-bold uppercase tracking-wide hover:border-paper"
        >
          {wished ? "Saved" : "Save"}
        </button>
      </div>

      {message && <p className="mb-6 text-xs font-semibold text-accent">{message}</p>}
    </div>
  );
}
