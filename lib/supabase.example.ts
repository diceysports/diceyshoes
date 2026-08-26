/**
 * Example Supabase wiring for when the catalog moves off the in-repo array in
 * `lib/products.ts` and into a real table.
 *
 * This file is intentionally excluded from `tsconfig.json` — `@supabase/supabase-js`
 * is not an installed dependency yet, so type-checking it would fail the build.
 * To turn it on:
 *
 *   1. npm install @supabase/supabase-js
 *   2. drop the "lib/supabase.example.ts" entry from tsconfig.json's `exclude`
 *   3. rename this file to lib/supabase.ts
 *   4. set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { createClient } from "@supabase/supabase-js";
import type { Product } from "./products";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient(url, anonKey);

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("face", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Product | null) ?? null;
}
