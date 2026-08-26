import { getProducts, type ProductFilters } from "@/lib/data/products";
import { getBrands } from "@/lib/data/brands";
import { ProductGrid } from "./ProductGrid";
import { FilterSidebar } from "./FilterSidebar";
import { MobileFilterDrawer } from "./MobileFilterDrawer";
import { SortMenu } from "./SortMenu";
import { Pagination } from "./Pagination";

export interface CollectionSearchParams {
  brand?: string;
  gender?: string;
  sort?: string;
  page?: string;
}

/**
 * Shared server-rendered catalog experience. Every collection route
 * (/shop, /men, /women, /sneakers, /luxury, /brands/[slug]) calls this
 * with a different `lockedFilters` (e.g. luxury locks brandSlugs to the
 * 6 fashion houses) plus the page's own searchParams for the parts the
 * shopper actually controls (brand within that set, gender, sort, page).
 */
export async function CollectionView({
  title,
  subtitle,
  basePath,
  lockedFilters,
  searchParams,
  hideBrandFilterFor,
}: {
  title: string;
  subtitle?: string;
  basePath: string;
  lockedFilters?: Partial<ProductFilters>;
  searchParams: CollectionSearchParams;
  /** brand slugs to exclude from the filter sidebar (e.g. already locked) */
  hideBrandFilterFor?: string[];
}) {
  const page = Number(searchParams.page) || 1;
  // A locked gender (used by /men, /women) always wins — those pages
  // must never be overridable via a stray ?gender= query param.
  const gender =
    lockedFilters?.gender ?? ((searchParams.gender as ProductFilters["gender"]) || undefined);
  const sort = (searchParams.sort as ProductFilters["sort"]) || "featured";

  const lockedBrandSet = lockedFilters?.brandSlugs;
  const brandSlugs = lockedBrandSet
    ? searchParams.brand && lockedBrandSet.includes(searchParams.brand)
      ? [searchParams.brand]
      : lockedBrandSet
    : searchParams.brand
    ? [searchParams.brand]
    : undefined;

  const [{ products, total, pageSize }, allBrands] = await Promise.all([
    getProducts({
      ...lockedFilters,
      brandSlugs,
      gender,
      sort,
      page,
      pageSize: 24,
    }),
    getBrands(),
  ]);

  const filterBrands = lockedBrandSet
    ? allBrands.filter((b) => lockedBrandSet.includes(b.slug))
    : hideBrandFilterFor
    ? allBrands.filter((b) => !hideBrandFilterFor.includes(b.slug))
    : allBrands;
  const showGenderFilter = !lockedFilters?.gender;

  return (
    <section className="mx-auto max-w-[1320px] px-5 py-14 md:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display mb-3 text-[clamp(32px,5vw,48px)] uppercase leading-none">
          {title}
        </h1>
        {subtitle && <p className="text-sm leading-relaxed text-fog">{subtitle}</p>}
      </div>

      <MobileFilterDrawer brands={filterBrands} showGenderFilter={showGenderFilter} />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px,1fr]">
        <div className="hidden md:block">
          {filterBrands.length > 0 && (
            <FilterSidebar brands={filterBrands} showGenderFilter={showGenderFilter} />
          )}
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs text-fog">
              {total.toLocaleString()} product{total === 1 ? "" : "s"}
            </span>
            <SortMenu />
          </div>

          <ProductGrid products={products} />

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath={basePath}
            searchParams={searchParams as Record<string, string | undefined>}
          />
        </div>
      </div>
    </section>
  );
}
