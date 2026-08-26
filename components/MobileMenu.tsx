"use client";

import Link from "next/link";
import clsx from "clsx";
import { DSMark } from "./DSMark";

export function MobileMenu({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: { href: string; label: string }[];
}) {
  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[340px] transform border-r border-chrome-line bg-chrome-surface text-white transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-chrome-line px-6 py-5">
          <span className="font-display text-lg"><DSMark size={30} /></span>
          <button aria-label="Close menu" onClick={onClose}>
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded px-3 py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/wishlist" onClick={onClose} className="rounded px-3 py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/5">
            Wishlist
          </Link>
          <Link href="/cart" onClick={onClose} className="rounded px-3 py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/5">
            Cart
          </Link>
        </nav>
      </div>
    </>
  );
}
