import type { Metadata } from "next";
import Link from "next/link";
import { getUpcomingReleases } from "@/lib/data/releases";
import { getProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/ProductGrid";
import { ReleaseCountdown } from "@/components/ReleaseCountdown";
import { formatMoney } from "@/lib/utils/price";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = { title: "New Releases" };
// Live catalog + release data — render per-request rather than freezing
// a build-time snapshot (matches how the rest of the data-driven routes
// already behave via searchParams/cookies-triggered dynamic rendering).
export const dynamic = "force-dynamic";

export default async function NewReleasesPage() {
  const [releases, { products: newest }] = await Promise.all([
    getUpcomingReleases(12),
    getProducts({ sort: "newest", pageSize: 16 }),
  ]);

  return (
    <section className="mx-auto max-w-[1320px] px-5 py-14 md:px-8">
      <h1 className="font-display mb-3 text-[clamp(32px,5vw,48px)] uppercase leading-none">
        New Releases
      </h1>
      <p className="mb-10 max-w-2xl text-sm leading-relaxed text-fog">
        The drops worth knowing about, with real dates and real countdowns.
      </p>

      {releases.length > 0 ? (
        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {releases.map((r) => {
            const href = r.isExternalSeed ? r.sourceUrl : `/product/${r.slug}`;
            return (
              <div
                key={r.slug}
                className="overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-transform hover:-translate-y-1"
              >
                <div className="mb-4 aspect-square overflow-hidden rounded-xl border border-line">
                  <ProductPlaceholder brand={r.brandName} model={r.colorwayName ?? r.productName} />
                </div>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-fog">{r.brandName}</div>
                <div className="mb-3 text-sm font-semibold">{r.productName}</div>
                <ReleaseCountdown releaseDate={r.releaseDate} />
                <div className="mt-4 flex items-center justify-between">
                  {r.price && <span className="text-sm font-bold">{formatMoney(r.price, r.currency)}</span>}
                  <Link
                    href={href}
                    target={r.isExternalSeed ? "_blank" : undefined}
                    rel={r.isExternalSeed ? "noreferrer" : undefined}
                    className="text-xs font-bold uppercase underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-16 rounded-2xl border border-dashed border-line px-10 py-14 text-center">
          <h3 className="font-display mb-3 text-2xl uppercase">No Confirmed Releases Yet</h3>
          <p className="mx-auto max-w-md text-sm text-fog">
            Check back soon — this section updates the moment a new drop date lands.
          </p>
        </div>
      )}

      <SectionHeading kicker="Just In" title="Trending Now" />
      <ProductGrid products={newest} />
    </section>
  );
}
