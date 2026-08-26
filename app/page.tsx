import Link from "next/link";
import { DiceRoller } from "@/components/DiceRoller";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-14">
      <section className="pt-4 text-center sm:pt-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          Six pieces · One roll
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Let the dice pick your next fit.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-bone-dim">
          Every piece in the DiceyApparel line sits on a face of a single die.
          Roll it, wear what comes up, and stop deliberating over clothes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-xl bg-bone px-6 py-3 font-semibold text-felt-950 transition hover:bg-white"
          >
            Browse all six
          </Link>
          <Link
            href="/product/snake-eyes-runner"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10"
          >
            Start with Snake Eyes
          </Link>
        </div>
      </section>

      <DiceRoller />

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">The full set</h2>
          <Link
            href="/shop"
            className="text-sm text-bone-dim transition hover:text-bone"
          >
            Shop all →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
