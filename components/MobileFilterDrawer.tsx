"use client";

import { useState } from "react";
import type { Brand } from "@/lib/types";
import { FilterSidebar } from "./FilterSidebar";
import clsx from "clsx";

export function MobileFilterDrawer({
  brands,
  showGenderFilter = true,
}: {
  brands: Brand[];
  showGenderFilter?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5 md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 border border-line py-3 text-xs font-bold uppercase tracking-wide"
      >
        Filter & Sort
      </button>

      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/60 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />
      <div
        className={clsx(
          "fixed inset-y-0 right-0 z-50 w-[82vw] max-w-[340px] transform overflow-y-auto border-l border-line bg-charcoal p-6 transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-bold uppercase">Filters</span>
          <button onClick={() => setOpen(false)} aria-label="Close filters">
            ✕
          </button>
        </div>
        <FilterSidebar brands={brands} showGenderFilter={showGenderFilter} />
        <button
          onClick={() => setOpen(false)}
          className="mt-8 w-full bg-paper py-3.5 text-xs font-bold uppercase tracking-wide text-ink"
        >
          Show Results
        </button>
      </div>
    </div>
  );
}
