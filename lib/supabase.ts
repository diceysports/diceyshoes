import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for the Dicey Shoes catalog
 * (project mmazwydwswrkqgisotyt).
 *
 * Key selection matters here. The `public_read_published_shoes` RLS policy only
 * exposes rows where `status = 'PUBLISHED'` to the anon role, so the anon key
 * sees nothing while the catalog is still in DRAFT. If SUPABASE_SERVICE_ROLE_KEY
 * is set it is used instead, which bypasses RLS and returns the full catalog.
 *
 * The service role key is read from a non-public env var and this module is only
 * imported from server components, so it is never shipped to the browser.
 */
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://mmazwydwswrkqgisotyt.supabase.co";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const key = serviceKey ?? anonKey;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** True when the catalog is being read with a key that bypasses RLS. */
export const usingServiceRole = Boolean(serviceKey);
