import Link from "next/link";
import type { Brand } from "@/lib/types";

export function BrandTicker({ brands }: { brands: Brand[] }) {
  const looped = [...brands, ...brands];

  return (
    <div className="overflow-hidden border-y border-chrome-line bg-chrome py-6">
      <div className="flex w-max animate-[ticker_28s_linear_infinite] gap-16">
        {looped.map((b, i) => (
          <Link
            key={`${b.slug}-${i}`}
            href={`/brands/${b.slug}`}
            className="font-display whitespace-nowrap text-2xl uppercase text-white/30 transition-colors hover:text-volt"
          >
            {b.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
