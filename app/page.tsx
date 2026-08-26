import Link from "next/link";
import { DiceRoller } from "@/components/DiceRoller";
import { HeroVideo } from "@/components/HeroVideo";
import { ProductCard } from "@/components/ProductCard";
import { fetchDiceProducts, fetchProducts } from "@/lib/catalog";
import { listHeroVideos } from "@/lib/heroVideos";

export const revalidate = 300;

export default async function HomePage() {
  const [heroVideos, diceProducts, featured] = await Promise.all([
    listHeroVideos(),
    fetchDiceProducts(),
    fetchProducts(12),
  ]);

  return (
    <div className="flex flex-col">
      <HeroVideo sources={heroVideos}>
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Sneaker discovery · One roll
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
            Your next pair, decided by the dice.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-bone-dim">
            A thousand-deep catalog of the sneakers people actually want. Roll
            for one, or browse the whole thing.
          </p>
          <div className="pointer-events-auto mt-7 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-xl bg-bone px-6 py-3 font-semibold text-felt-950 transition hover:bg-white"
            >
              Shop the catalog
            </Link>
            <Link
              href="#roll"
              className="rounded-xl border border-white/25 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/10"
            >
              Roll the die
            </Link>
          </div>
        </div>
      </HeroVideo>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-14 sm:px-6">
        <div id="roll" className="scroll-mt-20">
          <DiceRoller products={diceProducts} />
        </div>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Heat in rotation
            </h2>
            <Link
              href="/shop"
              className="text-sm text-bone-dim transition hover:text-bone"
            >
              Shop all →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-felt-900 p-6 text-bone-dim">
              The catalog is not reachable right now. Check the Supabase
              credentials and that the products are readable.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
