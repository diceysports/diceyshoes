import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY privileged client. Uses the service role key, which
 * bypasses RLS entirely.
 *
 * WHY THIS EXISTS: shoe_products' public RLS policy only allows
 * anon/authenticated SELECT where status = 'PUBLISHED'. All 1,000
 * current master products are status = 'DRAFT', and several
 * source/internal tables (shoe_colorways, shoe_product_media,
 * shoe_supplier_products, etc.) have RLS enabled with NO public read
 * policy at all. The anon client (lib/supabase/server.ts,
 * lib/supabase/client.ts) genuinely cannot read this data — that's
 * correct and expected, not a bug to route around by weakening RLS.
 *
 * Instead, this app's SERVER-SIDE DATA LAYER becomes the security
 * boundary: it reads with elevated access, then hand-picks only
 * storefront-safe fields into the typed domain model before anything
 * reaches a component. See lib/data/products.ts, supplier.ts,
 * releases.ts, search.ts for what is/isn't exposed.
 *
 * The `import "server-only"` line makes any accidental import from a
 * "use client" file a build-time error, not a runtime leak.
 *
 * NEVER import this file from:
 *   - a "use client" component
 *   - context/CartContext.tsx, context/WishlistContext.tsx
 *   - lib/supabase/client.ts
 *   - anything under components/ that runs in the browser
 * Only lib/data/*.ts and Route Handlers (app/api/*) should import it.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing server Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY must both be set on the server. " +
        "SUPABASE_SERVICE_ROLE_KEY must never be prefixed NEXT_PUBLIC_."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
