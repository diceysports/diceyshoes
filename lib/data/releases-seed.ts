import type { ReleaseEntry } from "@/lib/types";

/**
 * SEEDED RELEASE DATA — sourced from Nice Kicks and Sneaker News on
 * August 26, 2026. This is not a live feed: there is no automated
 * ingestion pipeline in this environment. Every entry below is a real,
 * currently-scheduled release with its real style code, date, and price
 * as published by the cited source — nothing here is invented.
 *
 * TO REFRESH: replace this array with a fresh pull from
 * https://www.nicekicks.com/release-dates/sneaker-releases/ and
 * https://sneakernews.com. Keep the same ReleaseEntry shape so
 * lib/data/releases.ts and every component consuming it needs no
 * changes. A real ingestion job (cron + fetch + parse) would populate
 * a `shoe_release_calendar` table and this file would be deleted in
 * favor of a Supabase query — the data layer is already structured so
 * that swap is a one-file change (see getUpcomingReleases below).
 */
export const SEEDED_RELEASES: ReleaseEntry[] = [
  {
    slug: "awake-air-jordan-6-blueberry",
    brandName: "Jordan",
    productName: "AWAKE x Air Jordan 6 \u201CBlueberry\u201D",
    colorwayName: "Midnight Navy / Infrared 23 / Game Royal / Light Blue",
    releaseDate: "2026-08-29",
    price: 230,
    currency: "USD",
    sourceName: "Sneaker News",
    sourceUrl: "https://sneakernews.com/2026/08/23/sneaker-releases-august-23-august-29/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan 6 Blueberry AWAKE",
  },
  {
    slug: "nike-foamposite-mashup-ao8760",
    brandName: "Nike",
    productName: "Nike Foamposite Mash-Up",
    colorwayName: null,
    releaseDate: "2026-08-30",
    price: 170,
    currency: "USD",
    sourceName: "WWD Footwear News",
    sourceUrl:
      "https://wwd.com/footwear-news/sneaker-news/sneaker-release-date-calendar-august-2026-1239088950/",
    isExternalSeed: true,
    externalImageQuery: "Nike Foamposite sneaker orange",
  },
  {
    slug: "jordan-university-red-light-soft-pink-fd2596",
    brandName: "Jordan",
    productName: "University Red / Light Soft Pink / Metallic Silver",
    colorwayName: "University Red / Light Soft Pink / Metallic Silver",
    releaseDate: "2026-09-02",
    price: 185,
    currency: "USD",
    sourceName: "Nice Kicks",
    sourceUrl: "https://www.nicekicks.com/air-jordan-release-dates/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan red pink sneaker",
  },
  {
    slug: "jordan-white-tour-yellow-io2463",
    brandName: "Jordan",
    productName: "White / Tour Yellow / Dark Blue Grey-Black",
    colorwayName: "White / Tour Yellow / Dark Blue Grey-Black",
    releaseDate: "2026-09-05",
    price: 220,
    currency: "USD",
    sourceName: "Nice Kicks",
    sourceUrl: "https://www.nicekicks.com/air-jordan-release-dates/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan yellow white sneaker",
  },
  {
    slug: "jordan-challenge-red-vibrant-yellow-ir2082",
    brandName: "Jordan",
    productName: "Challenge Red / Black / Vibrant Yellow",
    colorwayName: "Challenge Red / Black / Vibrant Yellow",
    releaseDate: "2026-09-26",
    price: 205,
    currency: "USD",
    sourceName: "Nice Kicks",
    sourceUrl: "https://www.nicekicks.com/air-jordan-release-dates/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan red black yellow sneaker",
  },
  {
    slug: "jordan-midnight-navy-multicolor-ix8478",
    brandName: "Jordan",
    productName: "Midnight Navy / Multicolor",
    colorwayName: "Midnight Navy / Multicolor",
    releaseDate: "2026-10-01",
    price: 165,
    currency: "USD",
    sourceName: "Nice Kicks",
    sourceUrl: "https://www.nicekicks.com/air-jordan-release-dates/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan navy sneaker",
  },
  {
    slug: "jordan-velvet-brown-pearl-white-ck9246",
    brandName: "Jordan",
    productName: "Velvet Brown / Pearl White / Gum Dark Brown",
    colorwayName: "Velvet Brown / Pearl White / Gum Dark Brown",
    releaseDate: "2026-10-03",
    price: 215,
    currency: "USD",
    sourceName: "Nice Kicks",
    sourceUrl: "https://www.nicekicks.com/air-jordan-release-dates/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan brown sneaker",
  },
  {
    slug: "jordan-forest-green-graphite-487471",
    brandName: "Jordan",
    productName: "White / Black / Deep Forest Green / Graphite",
    colorwayName: "White / Black / Deep Forest Green / Graphite",
    releaseDate: "2026-10-31",
    price: 215,
    currency: "USD",
    sourceName: "Nice Kicks",
    sourceUrl: "https://www.nicekicks.com/air-jordan-release-dates/",
    isExternalSeed: true,
    externalImageQuery: "Air Jordan green sneaker",
  },
];
