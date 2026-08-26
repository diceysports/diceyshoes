import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductArt } from "@/components/ProductArt";
import {
  fetchProductBySlug,
  fetchSizes,
  formatPrice,
} from "@/lib/catalog";

export const revalidate = 300;

/**
 * Params are resolved at request time rather than prerendered: the catalog is
 * 1000 rows behind a network call, so generateStaticParams would tie every
 * build to Supabase being reachable.
 */
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description:
      product.description ??
      `${product.brand ?? "Dicey Shoes"} — ${product.name}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const sizes = await fetchSizes(product.sizeProfileKey);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/shop"
        className="text-sm text-bone-dim transition hover:text-bone"
      >
        ← Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductArt
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[16/11] w-full"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />

        <div>
          {product.brand && (
            <span className="text-xs uppercase tracking-[0.3em] text-gold">
              {product.brand}
            </span>
          )}

          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-5 font-mono text-2xl text-gold">
            {formatPrice(product.price, product.currency)}
          </p>

          {product.description && (
            <p className="mt-6 leading-relaxed text-bone-dim">
              {product.description}
            </p>
          )}

          <AddToCart product={product} sizes={sizes} />

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-sm">
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Model</dt>
              <dd className="mt-1 font-medium">{product.model ?? "—"}</dd>
            </div>
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Style code</dt>
              <dd className="mt-1 font-mono font-medium">
                {product.styleCode ?? "—"}
              </dd>
            </div>
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Colorway</dt>
              <dd className="mt-1 font-medium">{product.colorway ?? "—"}</dd>
            </div>
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Shipping</dt>
              <dd className="mt-1 font-medium">Free, both ways</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
