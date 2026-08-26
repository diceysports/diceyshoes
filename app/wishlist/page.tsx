"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { formatMoney } from "@/lib/utils/price";

export default function WishlistPage() {
  const { items, remove } = useWishlist();

  return (
    <section className="mx-auto max-w-[900px] px-5 py-14 md:px-8">
      <h1 className="font-display mb-10 text-[clamp(32px,5vw,48px)] uppercase leading-none">
        Wishlist
      </h1>

      {items.length === 0 ? (
        <div className="rounded border border-dashed border-line px-10 py-16 text-center">
          <p className="mb-6 text-sm text-fog">Nothing saved yet.</p>
          <Link href="/shop" className="inline-block bg-paper px-6 py-3 text-xs font-bold uppercase tracking-wide text-ink">
            Browse The Catalog
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-line border-t border-line">
          {items.map((item) => {
            const href = `/product/${item.slug}`;
            return (
              <div key={`${item.kind}-${item.id}`} className="flex items-center gap-5 py-6">
                <Link href={href} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-line">
                  <ProductPlaceholder brand={item.brand} size="sm" />
                </Link>
                <div className="flex-1">
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-fog">{item.brand}</div>
                  <Link href={href} className="text-sm font-semibold hover:underline">
                    {item.name}
                  </Link>
                </div>
                <div className="text-sm font-bold">
                  {item.price ? formatMoney(item.price, item.currency) : "—"}
                </div>
                <button
                  onClick={() => remove(item.kind, item.id)}
                  className="text-xs font-semibold uppercase text-fog underline hover:text-paper"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
