import type { Metadata } from "next";
import { CollectionView, type CollectionSearchParams } from "@/components/CollectionView";

export const metadata: Metadata = { title: "Men" };

export default function MenPage({ searchParams }: { searchParams: CollectionSearchParams }) {
  return (
    <CollectionView
      title="Men's Collection"
      subtitle="Sneakers, sportswear and luxury footwear cut for men — from Air Jordan to Louis Vuitton."
      basePath="/men"
      lockedFilters={{ gender: "MEN" }}
      searchParams={searchParams}
    />
  );
}
