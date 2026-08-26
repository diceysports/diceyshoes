import type { NewsArticle } from "@/lib/types";
import { SEEDED_NEWS } from "./news-seed";

/**
 * There is no news table in the Dicey Shoes database and this build has
 * no live automated ingestion. This adapter is the ONLY place the News
 * UI touches data — it currently reads a manually-curated, real seed
 * (lib/data/news-seed.ts, sourced from Sneaker News, Hypebeast, and
 * Andscape). When a live source is connected, implement it here;
 * nothing in app/news/* needs to change.
 */
export async function getLatestNews(limit = 6): Promise<NewsArticle[]> {
  return [...SEEDED_NEWS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  return SEEDED_NEWS.find((a) => a.slug === slug) ?? null;
}
