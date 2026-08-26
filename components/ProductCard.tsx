import Link from "next/link";
import { ProductArt } from "./ProductArt";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-felt-900 p-3 transition hover:-translate-y-1 hover:border-white/25 hover:bg-felt-800"
    >
      <ProductArt
        src={product.imageUrl}
        alt={product.name}
        className="aspect-[16/10] w-full"
      />

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <p className="text-xs uppercase tracking-widest text-gold">
            {product.brand}
          </p>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold tracking-tight">
            {product.name}
          </h3>
          <span className="shrink-0 font-mono text-sm text-gold">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>
        {product.styleCode && (
          <p className="mt-1 font-mono text-xs text-bone-dim">
            {product.styleCode}
          </p>
        )}
      </div>
    </Link>
  );
}
