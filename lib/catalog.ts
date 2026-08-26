import { getSupabase } from "./supabase";

/** A catalog shoe, normalized from `shoe_products` for the storefront UI. */
export type Product = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  model: string | null;
  colorway: string | null;
  styleCode: string | null;
  category: string | null;
  description: string | null;
  /** Price in US cents. */
  price: number;
  currency: string;
  imageUrl: string | null;
  productUrl: string | null;
  popularityTier: string | null;
  sizeProfileKey: string | null;
  /** Assigned 1-6 for the six shoes wired to the dice widget. */
  face?: number;
};

type ProductRow = {
  product_id: number;
  name: string | null;
  model: string | null;
  colorway: string | null;
  style_code: string | null;
  category: string | null;
  description: string | null;
  retail_price: number | string | null;
  currency: string | null;
  image_url: string | null;
  product_url: string | null;
  popularity_tier: string | null;
  size_profile_key: string | null;
  shoe_brands: { name: string | null } | { name: string | null }[] | null;
};

const SELECT =
  "product_id,name,model,colorway,style_code,category,description,retail_price,currency,image_url,product_url,popularity_tier,size_profile_key,shoe_brands(name)";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Slugs carry the product id so they stay unique — style codes repeat across
 * the catalog (906 distinct across 1000 rows) and names are not unique either.
 */
export function productSlug(id: number, name: string | null): string {
  const base = slugify(name ?? "shoe") || "shoe";
  return `${base}-${id}`;
}

export function idFromSlug(slug: string): number | null {
  const match = /-(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}

function brandName(row: ProductRow): string | null {
  const brand = row.shoe_brands;
  if (!brand) return null;
  return Array.isArray(brand) ? (brand[0]?.name ?? null) : brand.name;
}

/** Catalog names arrive with retailer cruft appended; trim it for display. */
export function cleanName(raw: string | null): string {
  if (!raw) return "Untitled";
  return raw.split("|")[0].split(" - ")[0].trim() || raw.trim();
}

function toProduct(row: ProductRow): Product {
  const priceNumber = Number(row.retail_price ?? 0);
  return {
    id: row.product_id,
    slug: productSlug(row.product_id, cleanName(row.name)),
    name: cleanName(row.name),
    brand: brandName(row),
    model: row.model,
    colorway: row.colorway,
    styleCode: row.style_code,
    category: row.category,
    description: row.description,
    price: Number.isFinite(priceNumber) ? Math.round(priceNumber * 100) : 0,
    currency: row.currency ?? "USD",
    imageUrl: row.image_url,
    productUrl: row.product_url,
    popularityTier: row.popularity_tier,
    sizeProfileKey: row.size_profile_key,
  };
}

/**
 * Every catalog read is wrapped: a missing key, an RLS-empty result or a network
 * failure yields an empty list rather than a thrown error, so the storefront and
 * the production build degrade to an empty-state instead of breaking.
 */
export async function fetchProducts(limit = 24): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("shoe_products")
      .select(SELECT)
      .not("image_url", "is", null)
      .order("rank_score", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown as ProductRow[]).map(toProduct);
  } catch {
    return [];
  }
}

export async function fetchProductBySlug(
  slug: string,
): Promise<Product | null> {
  const id = idFromSlug(slug);
  if (id === null) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("shoe_products")
      .select(SELECT)
      .eq("product_id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toProduct(data as unknown as ProductRow);
  } catch {
    return null;
  }
}

/** The six shoes wired to the dice faces. */
export async function fetchDiceProducts(): Promise<Product[]> {
  const products = await fetchProducts(6);
  return products.map((product, index) => ({ ...product, face: index + 1 }));
}

export async function fetchSizes(profileKey: string | null): Promise<string[]> {
  if (!profileKey) return [];
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("shoe_size_conversions")
      .select("us_men,base_label")
      .eq("profile_key", profileKey)
      .limit(40);
    if (error || !data) return [];
    const rows = data as { us_men: string | null; base_label: string | null }[];
    const sizes = rows
      .map((row) => row.us_men ?? row.base_label)
      .filter((size): size is string => Boolean(size));
    return Array.from(new Set(sizes));
  } catch {
    return [];
  }
}

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
