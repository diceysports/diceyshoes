import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { Die } from "@/components/Die";
import { ShoeArt } from "@/components/ShoeArt";
import { formatPrice, getProduct, products } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return { title: "Not found" };
  }

  return {
    title: product.name,
    description: product.tagline,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/shop"
        className="text-sm text-bone-dim transition hover:text-bone"
      >
        ← Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ShoeArt product={product} className="aspect-[16/11] w-full" />

        <div>
          <div className="flex items-center gap-3">
            <Die face={product.face} className="h-8 w-8" />
            <span className="text-xs uppercase tracking-[0.3em] text-gold">
              Face {product.face} of 6
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-bone-dim">{product.tagline}</p>
          <p className="mt-5 font-mono text-2xl text-gold">
            {formatPrice(product.price)}
          </p>

          <p className="mt-6 leading-relaxed text-bone-dim">
            {product.description}
          </p>

          <AddToCart product={product} />

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-sm">
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Colorway</dt>
              <dd className="mt-1 font-medium">{product.colorway}</dd>
            </div>
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Heel drop</dt>
              <dd className="mt-1 font-medium">{product.drop}</dd>
            </div>
            <div className="bg-felt-900 p-4">
              <dt className="text-bone-dim">Sizes</dt>
              <dd className="mt-1 font-medium">
                {product.sizes[0]}–{product.sizes[product.sizes.length - 1]} US
              </dd>
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
