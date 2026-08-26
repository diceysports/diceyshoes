import type { Metadata } from "next";
import { CollectionView, type CollectionSearchParams } from "@/components/CollectionView";

export const metadata: Metadata = { title: "Women" };

export default function WomenPage({ searchParams }: { searchParams: CollectionSearchParams }) {
  return (
    <CollectionView
      title="Women's Collection"
      subtitle="Sneakers, sportswear and luxury footwear cut for women — from Yeezy to Gucci."
      basePath="/women"
      lockedFilters={{ gender: "WOMEN" }}
      searchParams={searchParams}
    />
  );
}
