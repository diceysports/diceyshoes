"use client";

import Link from "next/link";
import { Die } from "./Die";
import { useCart } from "@/lib/cart";

export function Header() {
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-felt-950/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Die face={5} className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">
            Dicey<span className="text-ember">Shoes</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/shop"
            className="rounded-lg px-3 py-2 text-bone-dim transition hover:bg-white/5 hover:text-bone"
          >
            Shop
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-bone-dim transition hover:bg-white/5 hover:text-bone"
          >
            Cart
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-xs font-semibold text-bone"
              aria-label={`${ready ? count : 0} items in cart`}
            >
              {ready ? count : 0}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
