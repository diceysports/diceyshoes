import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandBySlug } from "@/lib/data/brands";
import { getProducts } from "@/lib/data/products";
import { CollectionView, type CollectionSearchParams } from "@/components/CollectionView";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const brand = await getBrandBySlug(params.slug);
  return { title: brand ? brand.name : "Brand" };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: CollectionSearchParams;
}) {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) notFound();

  const { total } = await getProducts({ brandSlugs: [brand.slug], pageSize: 1 });

  return (
    <CollectionView
      title={brand.name}
      subtitle={`${total.toLocaleString()} model${total === 1 ? "" : "s"} in the Dicey Shoes catalog.`}
      basePath={`/brands/${brand.slug}`}
      lockedFilters={{ brandSlugs: [brand.slug] }}
      searchParams={searchParams}
    />
  );
}
