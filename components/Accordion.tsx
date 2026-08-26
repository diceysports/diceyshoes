"use client";

import { useState } from "react";

export function Accordion({ items }: { items: { title: string; body: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const visible = items.filter((i) => i.body && i.body.trim().length > 0);

  if (visible.length === 0) return null;

  return (
    <div className="border-t border-line">
      {visible.map((item, i) => (
        <div key={item.title} className="border-b border-line">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-center justify-between py-4 text-left text-[13px] font-bold uppercase tracking-wide"
          >
            {item.title}
            <span className="text-lg font-normal">{openIdx === i ? "−" : "+"}</span>
          </button>
          {openIdx === i && (
            <p className="pb-4 text-[13.5px] leading-relaxed text-paper/80">{item.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}
