import { createAdminClient } from "@/lib/supabase/admin";
import type { MasterProduct } from "@/lib/types";
import { adaptPrice } from "@/lib/utils/price";
import { cleanDisplayName } from "@/lib/utils/text";
import { buildProductSlug } from "@/lib/utils/slug";

const SEARCH_SELECT = `
  product_id, name, model, colorway, style_code, gender, category, description,
  retail_price, currency, price_type, price_reference_at, popularity_tier,
  rank_score, available_sizes, status,
  shoe_brands ( brand_id, name, slug )
`;

export async function searchProducts(query: string, limit = 12): Promise<MasterProduct[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = createAdminClient();
  // Search across name, model, style_code. Brand name is matched via a
  // second query against shoe_brands and merged, since PostgREST can't
  // OR-match a joined table's column directly in one filter expression.
  const like = `%${trimmed}%`;

  const [byFields, byBrand] = await Promise.all([
    supabase
      .from("shoe_products")
      .select(SEARCH_SELECT)
      .eq("status", "DRAFT")
      .or(`name.ilike.${like},model.ilike.${like},style_code.ilike.${like}`)
      .order("rank_score", { ascending: false })
      .limit(limit),
    supabase
      .from("shoe_brands")
      .select("brand_id")
      .ilike("name", like),
  ]);

  if (byFields.error) throw new Error(`searchProducts: ${byFields.error.message}`);

  const results = new Map<number, any>();
  for (const row of byFields.data ?? []) results.set(row.product_id, row);

  const brandIds = (byBrand.data ?? []).map((b) => b.brand_id);
  if (brandIds.length > 0 && results.size < limit) {
    const { data: brandMatches } = await supabase
      .from("shoe_products")
      .select(SEARCH_SELECT)
      .eq("status", "DRAFT")
      .in("brand_id", brandIds)
      .order("rank_score", { ascending: false })
      .limit(limit);
    for (const row of brandMatches ?? []) {
      if (!results.has(row.product_id)) results.set(row.product_id, row);
    }
  }

  return Array.from(results.values())
    .slice(0, limit)
    .map((row) => {
      const brandRow = Array.isArray(row.shoe_brands) ? row.shoe_brands[0]! : row.shoe_brands;
      const brand = { brandId: brandRow.brand_id, name: brandRow.name, slug: brandRow.slug };
      const { name: cleanedName, extractedStyleCode } = cleanDisplayName(row.name);
      return {
        productId: row.product_id,
        brand,
        name: cleanedName,
        model: row.model,
        colorway: row.colorway,
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
      } satisfies MasterProduct;
    });
}
