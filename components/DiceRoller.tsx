"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Die } from "./Die";
import { ProductArt } from "./ProductArt";
import { formatPrice, type Product } from "@/lib/catalog";

const ROLL_MS = 900;
const TICK_MS = 90;

export function DiceRoller({ products }: { products: Product[] }) {
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  const faces = products.length || 6;

  const roll = useCallback(() => {
    if (rolling || products.length === 0) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRolling(true);
    setResult(null);

    const landed = 1 + Math.floor(Math.random() * faces);

    for (let elapsed = TICK_MS; elapsed < ROLL_MS; elapsed += TICK_MS) {
      timers.current.push(
        setTimeout(() => setFace(1 + Math.floor(Math.random() * faces)), elapsed),
      );
    }

    timers.current.push(
      setTimeout(() => {
        setFace(landed);
        setResult(landed);
        setRolling(false);
      }, ROLL_MS),
    );
  }, [rolling, faces, products.length]);

  const picked =
    result === null
      ? null
      : (products.find((product) => product.face === result) ??
        products[(result - 1) % products.length]);

  return (
    <section className="rounded-3xl border border-white/10 bg-felt-900 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
        <div className="flex flex-col items-center gap-4">
          <Die
            face={face}
            className={`h-28 w-28 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] ${
              rolling ? "animate-tumble" : ""
            }`}
          />
          <button
            type="button"
            onClick={roll}
            disabled={rolling || products.length === 0}
            className="rounded-xl bg-ember px-6 py-3 font-semibold text-bone transition hover:bg-ember-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {rolling ? "Rolling…" : "Roll the die"}
          </button>
        </div>

        <div className="min-h-40 flex-1" aria-live="polite">
          {!picked && (
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold tracking-tight">
                Can&apos;t decide? Let the die decide.
              </h2>
              <p className="mt-2 text-bone-dim">
                {products.length === 0
                  ? "The catalog is not reachable right now, so there is nothing to roll for yet."
                  : "Six shoes, six faces. One roll and the house picks your pair — you can always roll again."}
              </p>
            </div>
          )}

          {picked && (
            <div className="animate-settle">
              <p className="text-xs uppercase tracking-widest text-bone-dim">
                You rolled a {result} — {picked.brand ?? "Dicey Shoes"}
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <ProductArt
                  src={picked.imageUrl}
                  alt={picked.name}
                  className="h-24 w-40 shrink-0"
                />
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {picked.name}
                  </h2>
                  <p className="mt-1 font-mono text-gold">
                    {formatPrice(picked.price, picked.currency)}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link
                      href={`/product/${picked.slug}`}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                    >
                      See the pair
                    </Link>
                    <button
                      type="button"
                      onClick={roll}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-bone-dim transition hover:text-bone"
                    >
                      Roll again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
