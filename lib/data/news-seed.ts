import type { NewsArticle } from "@/lib/types";

/**
 * SEEDED NEWS DATA — curated from reputable sneaker/fashion media on
 * August 26, 2026. There is no automated ingestion pipeline in this
 * environment, so this is a manually-refreshed seed rather than a live
 * feed — but every headline, source, URL, and date below is real.
 * Summaries are written in our own words, not copied from the source.
 *
 * TO REFRESH: pull current stories from Sneaker News, Hypebeast, Nice
 * Kicks, and Andscape, replace this array, keep the same shape. A real
 * ingestion job would populate a `shoe_news` table and this file would
 * be deleted in favor of a Supabase query.
 */
export const SEEDED_NEWS: NewsArticle[] = [
  {
    slug: "jordan-brand-august-2026-lineup",
    headline: "Jordan Brand's August 2026 Release Slate Is One of the Year's Biggest",
    category: "Releases",
    summary:
      "Jordan Brand closes out summer with a packed run of collabs, original colorways, and new styles — headlined by the return of two '90s classics, the Air Jordan 9 \u201CSpace Jam\u201D and the Air Jordan 13 \u201CFlint.\u201D",
    publishedAt: "2026-07-30",
    sourceName: "Sneaker News",
    sourceUrl: "https://sneakernews.com/2026/07/30/jordan-release-dates-august-2026/",
    imageQuery: "Air Jordan 13 Flint sneaker",
  },
  {
    slug: "sneaker-releases-august-23-29",
    headline: "AWAKE's Air Jordan 6, a Westside Gunn Collab, and This Week's Best Releases",
    category: "Releases",
    summary:
      "This week's release roundup is led by the long-teased AWAKE Air Jordan 6 raffle, alongside a fur-trimmed Westside Gunn x Saucony Grid Jazz 9 and a run of Nike Air Force 1 and Shox drops closing out August.",
    publishedAt: "2026-08-23",
    sourceName: "Sneaker News",
    sourceUrl: "https://sneakernews.com/2026/08/23/sneaker-releases-august-23-august-29/",
    imageQuery: "Air Jordan 6 sneaker release",
  },
  {
    slug: "biggest-sneaker-releases-august-2026",
    headline: "The Biggest Sneaker Releases Dropping This August",
    category: "Culture",
    summary:
      "August's release calendar leans hard on nostalgia and original colorways, from a full-family Air Jordan 13 \u201CFlint\u201D restock to the surprise comeback of the Reebok G-Unit G6 and a Free The Youth take on the Air Jordan 16.",
    publishedAt: "2026-07-26",
    sourceName: "CassiusLife",
    sourceUrl: "https://cassiuslife.com/1407827/biggest-sneaker-releases-august-2026/",
    imageQuery: "Air Jordan 16 Free The Youth sneaker",
  },
  {
    slug: "hypebeast-2026-sneaker-preview",
    headline: "26 Sneaker Releases to Look Forward to in 2026",
    category: "Industry",
    summary:
      "Hypebeast's running preview of the year's biggest footwear moments spans Nike, Jordan, adidas and more — including the return of Nike's designer-led Doernbecher Freestyle program and a wave of new basketball signature shoes.",
    publishedAt: "2026-01-09",
    sourceName: "Hypebeast",
    sourceUrl: "https://hypebeast.com/2026/1/sneaker-release-preview-2026-info",
    imageQuery: "Nike Doernbecher Freestyle sneaker",
  },
  {
    slug: "andscape-august-best-drops",
    headline: "August's Best Sneaker Drops: This Month's Must-Haves",
    category: "Releases",
    summary:
      "Andscape's monthly guide highlights Shai Gilgeous-Alexander's farewell three-pack of Converse Shai 001s alongside Free The Youth's reworked, metallic-finished take on the Air Jordan 16.",
    publishedAt: "2026-08-05",
    sourceName: "Andscape",
    sourceUrl:
      "https://andscape.com/features/best-sneaker-releases-august-2026-adidas-nike-jordan-kith-salomon/",
    imageQuery: "Converse Shai 001 sneaker",
  },
];
