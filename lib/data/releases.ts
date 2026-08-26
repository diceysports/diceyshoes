import { createAdminClient } from "@/lib/supabase/admin";
import { cleanDisplayName } from "@/lib/utils/text";
import { buildProductSlug } from "@/lib/utils/slug";
import type { ReleaseEntry } from "@/lib/types";
import { SEEDED_RELEASES } from "./releases-seed";

const RELEASE_SELECT = `
  colorway_id, release_date, colorway_name, retail_price, currency,
  shoe_products!inner (
    product_id, name, model, status,
    shoe_brands ( name, slug )
  )
`;

interface ReleaseRow {
  colorway_id: number;
  release_date: string;
  colorway_name: string | null;
  retail_price: number | string | null;
  currency: string | null;
  shoe_products: {
    product_id: number;
    name: string;
    model: string | null;
    status: string;
    shoe_brands: { name: string; slug: string } | { name: string; slug: string }[];
  };
}

function fromDbRow(row: ReleaseRow): ReleaseEntry {
  const product = row.shoe_products;
  const brand = Array.isArray(product.shoe_brands) ? product.shoe_brands[0]! : product.shoe_brands;

  return {
    slug: buildProductSlug({ id: product.product_id, brandSlug: brand.slug, model: product.model }),
    brandName: brand.name,
    productName: cleanDisplayName(product.name).name,
    colorwayName: row.colorway_name,
    releaseDate: row.release_date,
    price: row.retail_price === null ? null : Number(row.retail_price),
    currency: row.currency ?? "USD",
    sourceName: "Dicey Shoes Catalog",
    sourceUrl: "",
    isExternalSeed: false,
  };
}

/**
 * Real future releases from two sources, merged:
 *  1. Any shoe_colorways row in our own database with a real future
 *     release_date (0 today, but the query stays live so this activates
 *     automatically the moment enrichment adds one).
 *  2. The curated Nice Kicks / Sneaker News seed (lib/data/releases-seed.ts)
 *     — real, currently-scheduled drops, manually refreshed since there's
 *     no live ingestion pipeline in this environment.
 * Nothing here is invented — every entry traces to a real source.
 */
export async function getUpcomingReleases(limit = 12): Promise<ReleaseEntry[]> {
  let dbReleases: ReleaseEntry[] = [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shoe_colorways")
      .select(RELEASE_SELECT)
      .gt("release_date", new Date().toISOString())
      .order("release_date", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);

    dbReleases = (data ?? []).map((r) => fromDbRow(r as unknown as ReleaseRow));
  } catch (err) {
    // Degrade to the curated seed list rather than taking down the page —
    // a transient Supabase/network issue shouldn't 500 the release calendar.
    console.error("getUpcomingReleases: falling back to seed releases —", err);
  }
  const now = Date.now();
  const seeded = SEEDED_RELEASES.filter((r) => new Date(r.releaseDate).getTime() > now);

  return [...dbReleases, ...seeded]
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
    .slice(0, limit);
}

export async function getNextRelease(): Promise<ReleaseEntry | null> {
  const releases = await getUpcomingReleases(1);
  return releases[0] ?? null;
}

export interface ReleaseCalendarBuckets {
  today: ReleaseEntry[];
  thisWeek: ReleaseEntry[];
  upcoming: ReleaseEntry[];
}

export async function getReleaseCalendar(): Promise<ReleaseCalendarBuckets> {
  const releases = await getUpcomingReleases(100);
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const today: ReleaseEntry[] = [];
  const thisWeek: ReleaseEntry[] = [];
  const upcoming: ReleaseEntry[] = [];

  for (const r of releases) {
    const d = new Date(r.releaseDate);
    if (d <= endOfToday) today.push(r);
    else if (d <= endOfWeek) thisWeek.push(r);
    else upcoming.push(r);
  }

  return { today, thisWeek, upcoming };
}
