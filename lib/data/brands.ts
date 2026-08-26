import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export async function getBrands(): Promise<Brand[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shoe_brands")
    .select("brand_id, name, slug")
    .order("name", { ascending: true });

  if (error) throw new Error(`getBrands: ${error.message}`);

  return (data ?? []).map((b) => ({
    brandId: b.brand_id,
    name: b.name,
    slug: b.slug,
  }));
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shoe_brands")
    .select("brand_id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getBrandBySlug: ${error.message}`);
  if (!data) return null;

  return { brandId: data.brand_id, name: data.name, slug: data.slug };
}

export const LUXURY_BRAND_SLUGS = [
  "balenciaga",
  "gucci",
  "louis-vuitton",
  "versace",
  "balmain",
  "christian-louboutin",
] as const;

export const SPORT_BRAND_SLUGS = ["nike", "jordan", "adidas", "yeezy"] as const;
