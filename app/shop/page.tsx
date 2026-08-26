import type { Metadata } from "next";
import { CollectionView, type CollectionSearchParams } from "@/components/CollectionView";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage({ searchParams }: { searchParams: CollectionSearchParams }) {
  return (
    <CollectionView
      title="The Catalog"
      subtitle="1,000 curated models across 10 brands — sneakers, sportswear and luxury footwear in one place."
      basePath="/shop"
      searchParams={searchParams}
    />
  );
}
