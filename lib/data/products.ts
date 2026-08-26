import { createAdminClient } from "@/lib/supabase/admin";
import type { MasterProduct, ProductMedia } from "@/lib/types";
import { adaptPrice } from "@/lib/utils/price";
import { cleanDisplayName } from "@/lib/utils/text";
import { buildProductSlug, idFromSlug } from "@/lib/utils/slug";
import { adaptMedia, type RawMediaRow } from "@/lib/utils/media";

const PRODUCT_SELECT = `
  product_id, name, model, colorway, style_code, gender, category, description,
  retail_price, currency, price_type, price_reference_at, popularity_tier,
  rank_score, available_sizes, status,
  shoe_brands ( brand_id, name, slug )
`;

// shoe_products row shape as returned by the select above.
interface ProductRow {
  product_id: number;
  name: string;
  model: string | null;
  colorway: string | null;
  style_code: string | null;
  gender: MasterProduct["gender"];
  category: string;
  description: string | null;
  retail_price: number | string | null;
  currency: string | null;
  price_type: string | null;
  price_reference_at: string | null;
  popularity_tier: MasterProduct["popularityTier"];
  rank_score: number | string;
  available_sizes: string[] | null;
  status: MasterProduct["status"];
  shoe_brands: { brand_id: number; name: string; slug: string } | { brand_id: number; name: string; slug: string }[];
}

function toMasterProduct(row: ProductRow): MasterProduct {
  const brandRow = Array.isArray(row.shoe_brands) ? row.shoe_brands[0]! : row.shoe_brands;
  const brand = { brandId: brandRow.brand_id, name: brandRow.name, slug: brandRow.slug };
  const { name: cleanedName, extractedStyleCode } = cleanDisplayName(row.name);

  return {
    productId: row.product_id,
    brand,
    name: cleanedName,
    model: row.model,
    colorway: row.colorway,
    // Prefer the dedicated column; fall back to a fragment the cleaner
    // found embedded in the raw title (e.g. "CD4487 100" scraped into
    // the name itself with no separate style_code value on file).
    styleCode: row.style_code || extractedStyleCode,
    gender: row.gender,
    category: row.category,
    description: row.description,
    price: adaptPrice({
      amount: row.retail_price,
      currency: row.currency,
      priceType: row.price_type,
      referenceAt: row.price_reference_at,
    }),
    popularityTier: row.popularity_tier,
    rankScore: Number(row.rank_score) || 0,
    availableSizes: row.available_sizes ?? [],
    status: row.status,
    slug: buildProductSlug({ id: row.product_id, brandSlug: brand.slug, model: row.model }),
  };
}

export interface ProductFilters {
  brandSlugs?: string[];
  gender?: "MEN" | "WOMEN" | "UNISEX";
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "newest" | "popular" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  products: MasterProduct[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * The one query every catalog/collection page goes through. Always
 * paginated with an explicit limit — never fetches the full 1,000-row
 * table.
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductPage> {
  const supabase = createAdminClient();
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 24, 60);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("shoe_products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("status", "DRAFT"); // current catalog state — see README

  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.minPrice !== undefined) query = query.gte("retail_price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("retail_price", filters.maxPrice);

  if (filters.brandSlugs && filters.brandSlugs.length > 0) {
    // shoe_brands is joined, so filter via the brand's slug through a
    // nested filter — Supabase requires the FK column when filtering a
    // joined table via PostgREST, so we resolve slugs to ids first.
    const { data: brandRows } = await supabase
      .from("shoe_brands")
      .select("brand_id")
      .in("slug", filters.brandSlugs);
    const ids = (brandRows ?? []).map((b) => b.brand_id);
    query = query.in("brand_id", ids.length > 0 ? ids : [-1]);
  }

  switch (filters.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("retail_price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("retail_price", { ascending: false, nullsFirst: false });
      break;
    case "popular":
      query = query.order("rank_score", { ascending: false });
      break;
    case "featured":
    default:
      query = query.order("popularity_tier", { ascending: true }).order("rank_score", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`getProducts: ${error.message}`);

  return {
    products: (data ?? []).map((r) => toMasterProduct(r as unknown as ProductRow)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProductBySlug(slug: string): Promise<MasterProduct | null> {
  const id = idFromSlug(slug);
  if (id === null) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shoe_products")
    .select(PRODUCT_SELECT)
    .eq("product_id", id)
    .maybeSingle();

  if (error) throw new Error(`getProductBySlug: ${error.message}`);
  if (!data) return null;

  return toMasterProduct(data as unknown as ProductRow);
}

export async function getProductMedia(masterProductId: number): Promise<ProductMedia[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shoe_product_media")
    .select(
      "media_id, media_type, angle, media_url, is_primary, usage_status, verification_status, storefront_approved"
    )
    .eq("master_product_id", masterProductId)
    .order("position", { ascending: true });

  if (error) throw new Error(`getProductMedia: ${error.message}`);

  const rows: RawMediaRow[] = (data ?? []).map((m) => ({
    mediaId: m.media_id,
    mediaType: m.media_type,
    angle: m.angle,
    mediaUrl: m.media_url,
    isPrimary: m.is_primary,
    usageStatus: m.usage_status,
    verificationStatus: m.verification_status,
    storefrontApproved: m.storefront_approved,
  }));

  return adaptMedia(rows);
}

export async function getFeaturedProducts(limit = 8): Promise<MasterProduct[]> {
  const { products } = await getProducts({ sort: "featured", pageSize: limit });
  return products;
}

export async function getBestSellers(limit = 8): Promise<MasterProduct[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shoe_products")
    .select(PRODUCT_SELECT)
    .eq("status", "DRAFT")
    .eq("popularity_tier", "A")
    .order("rank_score", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getBestSellers: ${error.message}`);
  return (data ?? []).map((r) => toMasterProduct(r as unknown as ProductRow));
}

export async function getProductsByBrand(
  brandSlug: string,
  opts: { page?: number; pageSize?: number; sort?: ProductFilters["sort"] } = {}
): Promise<ProductPage> {
  return getProducts({ brandSlugs: [brandSlug], ...opts });
}

/**
 * Ranking hierarchy per project rules: verified sibling colorways first
 * (not yet available — no VERIFIED colorways exist), then same model
 * family (approximated here via same `model` text on the same brand),
 * then same brand, then same category. Never returns the source product.
 */
export interface ProductColorway {
  colorwayId: number;
  colorwayName: string | null;
  releaseDate: string | null;
  verificationStatus: "PENDING" | "PARTIAL" | "VERIFIED" | "CONFLICT" | "REJECTED";
}

/**
 * Only returns colorway_name / release_date to the UI when
 * verification_status is VERIFIED — a PENDING/PARTIAL colorway row is
 * enrichment-in-progress data, not something to present as fact on a
 * product page.
 */
export async function getVerifiedColorway(masterProductId: number): Promise<ProductColorway | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shoe_colorways")
    .select("colorway_id, colorway_name, release_date, verification_status")
    .eq("master_product_id", masterProductId)
    .maybeSingle();

  if (error) throw new Error(`getVerifiedColorway: ${error.message}`);
  if (!data) return null;

  return {
    colorwayId: data.colorway_id,
    colorwayName: data.verification_status === "VERIFIED" ? data.colorway_name : null,
    releaseDate: data.release_date,
    verificationStatus: data.verification_status,
  };
}

export async function getRelatedProducts(product: MasterProduct, limit = 4): Promise<MasterProduct[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("shoe_products")
    .select(PRODUCT_SELECT)
    .eq("status", "DRAFT")
    .neq("product_id", product.productId)
    .eq("brand_id", product.brand.brandId)
    .limit(limit);

  if (product.model) query = query.eq("model", product.model);

  const { data, error } = await query;
  if (error) throw new Error(`getRelatedProducts: ${error.message}`);

  let results = (data ?? []).map((r) => toMasterProduct(r as unknown as ProductRow));

  if (results.length < limit) {
    const { data: brandFallback } = await supabase
      .from("shoe_products")
      .select(PRODUCT_SELECT)
      .eq("status", "DRAFT")
      .neq("product_id", product.productId)
      .eq("brand_id", product.brand.brandId)
      .limit(limit - results.length);

    const seen = new Set(results.map((r) => r.productId));
    for (const row of brandFallback ?? []) {
      const p = toMasterProduct(row as unknown as ProductRow);
      if (!seen.has(p.productId)) results.push(p);
    }
  }

  return results.slice(0, limit);
}
