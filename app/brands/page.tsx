import type { Metadata } from "next";
import Link from "next/link";
import { getBrands, LUXURY_BRAND_SLUGS } from "@/lib/data/brands";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <section className="mx-auto max-w-[1320px] px-5 py-14 md:px-8">
      <h1 className="font-display mb-3 text-[clamp(32px,5vw,48px)] uppercase leading-none">
        Brands
      </h1>
      <p className="mb-12 max-w-2xl text-sm leading-relaxed text-fog">
        Ten brands, one catalog — sport culture and luxury fashion side by side.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className="group relative flex h-40 items-end overflow-hidden rounded border border-line bg-charcoal p-6 transition-colors hover:border-accent"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background: "radial-gradient(circle at 75% 20%, rgba(53,84,255,0.16), transparent 60%)",
              }}
            />
            <div className="relative">
              <span className="font-display text-2xl uppercase">{b.name}</span>
              {LUXURY_BRAND_SLUGS.includes(b.slug as (typeof LUXURY_BRAND_SLUGS)[number]) && (
                <span className="ml-3 align-middle text-[10px] font-bold uppercase tracking-wide text-fog">
                  Luxury
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
