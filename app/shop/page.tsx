import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "All six DiceyApparel pieces — one for every face of the die.",
};

export default function ShopPage() {
  return (
    <div>
      <header className="border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {products.length} pieces
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          The whole set
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-bone-dim">
          One piece per face. Free shipping both ways, because sometimes the die
          is wrong.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
