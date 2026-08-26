import Link from "next/link";
import type { ReleaseEntry } from "@/lib/types";
import { ReleaseCountdown } from "./ReleaseCountdown";
import { formatMoney } from "@/lib/utils/price";
import { ProductPlaceholder } from "./ProductPlaceholder";

export function ReleaseRadar({ next }: { next: ReleaseEntry | null }) {
  if (!next) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-10 py-14 text-center">
        <h3 className="font-display mb-3 text-2xl uppercase">Tracking Next Drop</h3>
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-fog">
          New drops are being tracked. Check back soon for upcoming releases.
        </p>
        <Link
          href="/releases"
          className="inline-block rounded-full border border-paper/25 px-6 py-3 text-xs font-bold uppercase tracking-wide hover:border-paper"
        >
          View Release Calendar
        </Link>
      </div>
    );
  }

  const viewHref = next.isExternalSeed ? next.sourceUrl : `/product/${next.slug}`;

  return (
    <div className="grid gap-8 rounded-2xl border border-line bg-surface p-8 md:grid-cols-[1fr,1.4fr] md:items-center">
      <div className="aspect-square overflow-hidden rounded-xl border border-line">
        <ProductPlaceholder brand={next.brandName} model={next.colorwayName} size="lg" />
      </div>
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-accent">{next.brandName}</div>
        <h3 className="font-display mb-1 text-3xl uppercase">{next.productName}</h3>
        {next.colorwayName && next.colorwayName !== next.productName && (
          <div className="mb-5 text-sm text-fog">{next.colorwayName}</div>
        )}
        <ReleaseCountdown releaseDate={next.releaseDate} />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {next.price && <span className="text-sm font-bold">{formatMoney(next.price, next.currency)}</span>}
          <Link
            href={viewHref}
            target={next.isExternalSeed ? "_blank" : undefined}
            rel={next.isExternalSeed ? "noreferrer" : undefined}
            className="rounded-full bg-paper px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-accent"
          >
            View Release
          </Link>
          <button className="rounded-full border border-paper/25 px-5 py-2.5 text-xs font-bold uppercase tracking-wide hover:border-paper">
            Notify Me
          </button>
        </div>
        {next.isExternalSeed && (
          <div className="mt-4 text-xs text-fog">Source: {next.sourceName}</div>
        )}
      </div>
    </div>
  );
}
