import Link from "next/link";
import { ShoeArt } from "./ShoeArt";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-felt-900 p-3 transition hover:-translate-y-1 hover:border-white/25 hover:bg-felt-800"
    >
      <ShoeArt product={product} className="aspect-[16/10] w-full" />

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold tracking-tight">{product.name}</h3>
          <span className="shrink-0 font-mono text-sm text-gold">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="text-sm text-bone-dim">{product.tagline}</p>
        <p className="mt-2 text-xs uppercase tracking-widest text-bone-dim/70">
          Rolls on {product.face}
        </p>
      </div>
    </Link>
  );
}
