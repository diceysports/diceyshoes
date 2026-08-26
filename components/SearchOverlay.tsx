"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MasterProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils/price";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(id);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-chrome/97">
      <div className="mx-auto max-w-2xl px-6 pt-24">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-chrome-fog">Search the catalog</span>
          <button onClick={onClose} aria-label="Close search">
            ✕
          </button>
        </div>
        <div className="flex items-center gap-3 border-b-2 border-white/20 pb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            placeholder="Brand, model, or style code…"
            className="w-full bg-transparent text-xl outline-none placeholder:text-chrome-fog"
          />
        </div>

        <div className="mt-6 max-h-[60vh] overflow-y-auto">
          {loading && <div className="py-8 text-center text-sm text-chrome-fog">Searching…</div>}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-sm text-chrome-fog">
              No products match “{query}”. Try a brand name or style code.
            </div>
          )}
          <div className="flex flex-col divide-y divide-line">
            {results.map((p) => (
              <Link
                key={p.productId}
                href={`/product/${p.slug}`}
                onClick={onClose}
                className="flex items-center justify-between gap-4 py-4 hover:opacity-80"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-chrome-fog">{p.brand.name}</div>
                  <div className="text-sm font-semibold">{p.name}</div>
                </div>
                {p.price.displayable && p.price.amount && (
                  <div className="text-sm font-bold">{formatMoney(p.price.amount, p.price.currency)}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
