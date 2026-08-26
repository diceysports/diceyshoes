"use client";

import { useState } from "react";
import clsx from "clsx";

export function SizeSelector({
  sizes,
  onSelect,
}: {
  sizes: { label: string; inStock: boolean }[];
  onSelect: (size: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mb-7 grid grid-cols-5 gap-2">
      {sizes.map((s) => (
        <button
          key={s.label}
          disabled={!s.inStock}
          onClick={() => {
            const next = selected === s.label ? null : s.label;
            setSelected(next);
            onSelect(next);
          }}
          className={clsx(
            "rounded-sm border py-3 text-center text-sm font-semibold transition-colors",
            !s.inStock && "cursor-not-allowed border-line text-paper/25 line-through",
            s.inStock && selected !== s.label && "border-line hover:border-paper/50",
            s.inStock && selected === s.label && "border-paper bg-paper text-ink"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
