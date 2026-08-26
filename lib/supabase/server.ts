import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components, Route
 * Handlers, and Server Actions — anon key + existing RLS policies,
 * exactly the same trust boundary as the browser client.
 *
 * This is intentionally NOT enough to read most of the catalog: RLS
 * only exposes shoe_products rows where status = 'PUBLISHED' (all
 * 1,000 current rows are DRAFT), and several source/internal tables
 * have no public read policy at all. lib/data/{products,supplier,
 * releases,search}.ts use lib/supabase/admin.ts (service role,
 * server-only) instead — see that file for why, and for the rule that
 * the data layer itself must only return storefront-safe fields.
 * lib/data/brands.ts keeps using THIS client because shoe_brands does
 * have a public read policy.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore
            // because middleware (if added later) refreshes sessions.
          }
        },
      },
    }
  );
}
