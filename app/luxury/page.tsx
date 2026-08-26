import type { Metadata } from "next";
import { CollectionView, type CollectionSearchParams } from "@/components/CollectionView";
import { LUXURY_BRAND_SLUGS } from "@/lib/data/brands";

export const metadata: Metadata = { title: "Luxury" };

export default function LuxuryPage({ searchParams }: { searchParams: CollectionSearchParams }) {
  return (
    <CollectionView
      title="Luxury, Redefined"
      subtitle="Balenciaga, Gucci, Louis Vuitton, Versace, Balmain and Christian Louboutin — fashion-house footwear alongside the sneaker catalog."
      basePath="/luxury"
      lockedFilters={{ brandSlugs: [...LUXURY_BRAND_SLUGS] }}
      searchParams={searchParams}
    />
  );
}
