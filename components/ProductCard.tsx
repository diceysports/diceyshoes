"use client";

import Link from "next/link";
import type { MasterProduct, ProductMedia } from "@/lib/types";
import { ProductPlaceholder } from "./ProductPlaceholder";
import { useWishlist } from "@/context/WishlistContext";
import { formatMoney } from "@/lib/utils/price";
import clsx from "clsx";

export function ProductCard({
  product,
  media,
  badge,
}: {
  product: MasterProduct;
  media?: ProductMedia[];
  badge?: { label: string; tone: "new" | "limited" };
}) {
  const { isWished, toggle } = useWishlist();
  const wished = isWished("master", product.productId);
  const safeImage = media?.find((m) => m.mediaType === "IMAGE" && m.storefrontSafe);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-xl">
        {badge && (
          <span
            className={clsx(
              "absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              badge.tone === "new" ? "bg-accent text-white" : "bg-paper text-ink"
            )}
          >
            {badge.label}
          </span>
        )}
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            toggle({
              kind: "master",
              id: product.productId,
              slug: product.slug,
              brand: product.brand.name,
              name: product.name,
              price: product.price.amount,
              currency: product.price.currency,
            });
          }}
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-paper/60 backdrop-blur"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={wished ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
            className={wished ? "text-volt" : "text-white"}
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>

        {safeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <ProductPlaceholder brand={product.brand.name} model={product.model} />
        )}
      </div>

      <div className="pt-3">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-fog">{product.brand.name}</div>
        <div className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</div>
        <div className="flex items-center justify-between">
          {product.price.displayable && product.price.amount ? (
            <span className="text-sm font-bold">
              {product.price.label && (
                <span className="mr-1.5 text-[10px] font-medium uppercase text-fog">
                  {product.price.label}
                </span>
              )}
              {formatMoney(product.price.amount, product.price.currency)}
            </span>
          ) : (
            <span className="text-sm text-fog">Price unavailable</span>
          )}
          <span className="font-mono text-[10px] text-fog">
            {product.styleCode ? `[${product.styleCode}]` : "NO SKU"}
          </span>
        </div>
      </div>
    </Link>
  );
}
