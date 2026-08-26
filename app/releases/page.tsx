import type { Metadata } from "next";
import Link from "next/link";
import { getReleaseCalendar } from "@/lib/data/releases";
import { ReleaseCountdown } from "@/components/ReleaseCountdown";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { formatMoney } from "@/lib/utils/price";
import type { ReleaseEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Release Calendar" };

function ReleaseCard({ r }: { r: ReleaseEntry }) {
  const href = r.isExternalSeed ? r.sourceUrl : `/product/${r.slug}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-transform hover:-translate-y-1">
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
          View Release
        </Link>
      </div>
    </div>
  );
}

export default async function ReleasesPage() {
  const { today, thisWeek, upcoming } = await getReleaseCalendar();
  const all = [...today, ...thisWeek, ...upcoming];

  const sections = [
    { label: "Today", items: today },
    { label: "This Week", items: thisWeek },
    { label: "Upcoming", items: upcoming },
    { label: "All Releases", items: all },
  ].filter((s) => s.items.length > 0);

  return (
    <section className="mx-auto max-w-[1320px] px-5 py-14 md:px-8">
      <h1 className="font-display mb-3 text-[clamp(32px,5vw,48px)] uppercase leading-none">
        Release Calendar
      </h1>
      <p className="mb-10 max-w-2xl text-sm leading-relaxed text-fog">
        Every date here is real and sourced — nothing is estimated or made up.
      </p>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-10 py-16 text-center">
          <h3 className="font-display mb-3 text-2xl uppercase">No Releases Scheduled</h3>
          <p className="mx-auto max-w-md text-sm text-fog">
            Nothing confirmed right now — check back soon for the next drop.
          </p>
        </div>
      ) : (
        <div className="space-y-14">
          {sections.map((s) => (
            <div key={s.label}>
              <h2 className="font-display mb-6 text-2xl uppercase">{s.label}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {s.items.map((r) => (
                  <ReleaseCard key={`${s.label}-${r.slug}`} r={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
