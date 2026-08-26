import Link from "next/link";
import { VideoHero } from "@/components/VideoHero";
import { ReleaseRadar } from "@/components/ReleaseRadar";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductGrid } from "@/components/ProductGrid";
import { BrandTicker } from "@/components/BrandTicker";
import { NewsCard } from "@/components/NewsCard";
import { Newsletter } from "@/components/Newsletter";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ScrollSpin } from "@/components/ScrollSpin";

import { getBrands } from "@/lib/data/brands";
import { getFeaturedProducts, getBestSellers, getProducts } from "@/lib/data/products";
import { getNextRelease } from "@/lib/data/releases";
import { getLatestNews } from "@/lib/data/news";

export default async function HomePage() {
  const [brands, nextRelease, trending, bestSellers, catalogPreview, news] = await Promise.all([
    getBrands(),
    getNextRelease(),
    getFeaturedProducts(8),
    getBestSellers(8),
    getProducts({ sort: "newest", pageSize: 8 }),
    getLatestNews(3),
  ]);

  const spotlight = bestSellers[0] ?? trending[0];

  return (
    <>
      <VideoHero />

      {/* Trending / Featured Now */}
      <section className="py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <ScrollReveal>
            <SectionHeading kicker="Right Now" title="Trending" href="/new-releases" linkLabel="See What's Hot" />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <ProductGrid products={trending} />
          </ScrollReveal>
        </div>
      </section>

      {/* Interactive shoe spotlight */}
      {spotlight && (
        <section className="border-y border-line bg-surface py-20 md:py-28">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-14 px-5 md:grid-cols-2 md:px-8">
            <ScrollReveal>
              <ScrollSpin speed={0.1}>
                <div className="aspect-square overflow-hidden rounded-2xl border border-line shadow-xl">
                  <ProductPlaceholder
                    brand={spotlight.brand.name}
                    model={spotlight.model}
                    styleCode={spotlight.styleCode}
                    size="lg"
                  />
                </div>
              </ScrollSpin>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Icon Status
              </span>
              <h2 className="font-display mb-5 text-[clamp(32px,5vw,54px)] uppercase leading-[0.95]">
                The Shoe Everyone&apos;s
                <br />
                Talking About.
              </h2>
              <p className="mb-7 max-w-md text-sm leading-relaxed text-fog">
                {spotlight.brand.name} {spotlight.name} — currently one of the most popular
                models in the catalog{spotlight.styleCode ? `, style ${spotlight.styleCode}` : ""}.
              </p>
              <Link
                href={`/product/${spotlight.slug}`}
                className="inline-block rounded-full bg-paper px-7 py-3.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-accent hover:text-white"
              >
                Discover The Story
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Shop by category */}
      <section className="py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <ScrollReveal>
            <SectionHeading kicker="Explore" title="Shop Your Style" />
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { href: "/sneakers", label: "Sneakers", glow: "accent" },
              { href: "/luxury", label: "Luxury", glow: "volt" },
              { href: "/men", label: "Men", glow: "accent" },
              { href: "/women", label: "Women", glow: "volt" },
            ].map((tile, i) => (
              <ScrollReveal key={tile.href} delay={i * 60}>
                <Link
                  href={tile.href}
                  className="group relative flex h-56 items-end overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-transform hover:-translate-y-1 md:h-64"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        tile.glow === "accent"
                          ? "radial-gradient(circle at 70% 20%, rgba(47,92,255,0.18), transparent 60%)"
                          : "radial-gradient(circle at 70% 20%, rgba(200,255,61,0.22), transparent 60%)",
                    }}
                  />
                  <span className="font-display relative text-2xl uppercase">{tile.label}</span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="border-y border-line bg-surface py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <ScrollReveal>
            <SectionHeading
              kicker="Community Favorites"
              title="What Everyone's Wearing"
              href="/shop?sort=popular"
              linkLabel="View All"
            />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <ProductGrid products={bestSellers} />
          </ScrollReveal>
        </div>
      </section>

      {/* Upcoming sneaker releases */}
      <section className="py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <ScrollReveal>
            <SectionHeading kicker="Release Radar" title="Next Drop" href="/releases" linkLabel="Full Calendar" />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <ReleaseRadar next={nextRelease} />
          </ScrollReveal>
        </div>
      </section>

      {/* Brand discovery */}
      <ScrollReveal>
        <BrandTicker brands={brands} />
      </ScrollReveal>

      {/* Sneaker news */}
      <section className="py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <ScrollReveal>
            <SectionHeading kicker="Editorial" title="From The Sneaker World" href="/news" linkLabel="All Stories" />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {news.map((a) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Explore full catalog */}
      <section className="border-y border-line bg-surface py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <ScrollReveal>
            <SectionHeading kicker="Full Range" title="Explore The Catalog" href="/shop" linkLabel="View All Shoes" />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <ProductGrid products={catalogPreview.products} />
          </ScrollReveal>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
