import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProductMedia,
  getRelatedProducts,
  getVerifiedColorway,
} from "@/lib/data/products";
import { resolveAvailability } from "@/lib/utils/availability";
import { formatMoney } from "@/lib/utils/price";
import { ProductGallery } from "@/components/ProductGallery";
import { BuyBox } from "@/components/BuyBox";
import { Accordion } from "@/components/Accordion";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeading } from "@/components/SectionHeading";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product" };
  return {
    title: `${product.brand.name} ${product.name}`,
    description: product.description ?? `${product.brand.name} ${product.name} — Dicey Shoes.`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [media, colorway, related] = await Promise.all([
    getProductMedia(product.productId),
    getVerifiedColorway(product.productId),
    getRelatedProducts(product, 4),
  ]);

  const stock = resolveAvailability({
    productId: product.productId,
    popularityTier: product.popularityTier,
    availableSizes: product.availableSizes,
    upcomingReleaseDate: colorway?.releaseDate ?? null,
  });

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
      <nav className="mb-8 text-xs text-fog">
        <span>{product.brand.name}</span> <span className="mx-1.5">/</span>{" "}
        <span className="text-paper/70">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.1fr,0.9fr] md:gap-16">
        <ProductGallery
          media={media}
          brand={product.brand.name}
          model={product.model}
          styleCode={product.styleCode}
        />

        <div>
          <div className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-accent">
            {product.brand.name}
          </div>
          <h1 className="font-display mb-3 text-[clamp(26px,4vw,40px)] uppercase leading-[1.02]">
            {product.name}
          </h1>
          {colorway?.colorwayName && (
            <div className="mb-4 text-sm text-fog">{colorway.colorwayName}</div>
          )}
          <div className="mb-6 inline-block rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-fog">
            {product.styleCode ? `STYLE ${product.styleCode}` : "STYLE CODE UNASSIGNED"}
          </div>

          <div className="mb-7">
            {product.price.displayable && product.price.amount ? (
              <>
                <div className="text-2xl font-bold">
                  {formatMoney(product.price.amount, product.price.currency)}
                </div>
                {product.price.label && (
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-fog">
                    {product.price.label}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-fog">Price not available</div>
            )}
          </div>

          <BuyBox product={product} stock={stock} />

          <Accordion
            items={[
              {
                title: "Product Details",
                body:
                  product.description ??
                  `${product.brand.name}${product.model ? ` ${product.model}` : ""}. ${
                    product.gender ? `Gender: ${product.gender}.` : ""
                  } Category: ${product.category}.`,
              },
              {
                title: "Size Guide",
                body:
                  product.availableSizes.length > 0
                    ? `Reference sizes on file: ${product.availableSizes.join(
                        ", "
                      )}. Fit can vary by model — when in doubt, size to your usual for this brand.`
                    : "",
              },
              {
                title: "Shipping & Returns",
                body:
                  stock.state === "IN_STOCK" || stock.state === "LOW_STOCK"
                    ? "Standard shipping and a 30-day return window apply."
                    : "",
              },
            ]}
          />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <SectionHeading kicker="Keep Exploring" title="You May Also Like" />
          <ProductGrid products={related} />
        </div>
      )}
    </section>
  );
}
