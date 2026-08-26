import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop",
  description: "The Dicey Shoes catalog — sneakers, luxury and everything between.",
};

export default async function ShopPage() {
  const products = await fetchProducts(48);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {products.length > 0 ? `${products.length} pairs` : "Catalog"}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          The whole run
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-bone-dim">
          Ranked by what is moving. Free shipping both ways, because sometimes
          the die is wrong.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-felt-900 p-6 text-bone-dim">
          The catalog is not reachable right now. Check the Supabase credentials
          and that the products are readable.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
