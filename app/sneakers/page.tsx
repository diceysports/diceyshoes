import type { Metadata } from "next";
import { CollectionView, type CollectionSearchParams } from "@/components/CollectionView";
import { SPORT_BRAND_SLUGS } from "@/lib/data/brands";

export const metadata: Metadata = { title: "Sneakers" };

export default function SneakersPage({ searchParams }: { searchParams: CollectionSearchParams }) {
  return (
    <CollectionView
      title="Sneakers"
      subtitle="Nike, Jordan, Adidas and Yeezy — the sport-culture core of the Dicey Shoes catalog."
      basePath="/sneakers"
      lockedFilters={{ brandSlugs: [...SPORT_BRAND_SLUGS] }}
      searchParams={searchParams}
    />
  );
}
