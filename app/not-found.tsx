import Link from "next/link";
import { Die } from "@/components/Die";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="flex gap-3">
        <Die face={3} className="h-16 w-16 -rotate-12" />
        <Die face={4} className="h-16 w-16 rotate-6" />
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Error 404</p>
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
        You rolled a seven.
      </h1>
      <p className="max-w-md text-lg text-bone-dim">
        No such page on this die. Pick the dice back up and try one of these
        instead.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-ember px-6 py-3 font-semibold text-bone transition hover:bg-ember-dark"
        >
          Back to the table
        </Link>
        <Link
          href="/shop"
          className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10"
        >
          Shop all six
        </Link>
      </div>
    </div>
  );
}
