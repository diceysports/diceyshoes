import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Only ever uses the public anon/publishable
 * key. Used sparingly — most reads happen server-side in lib/data/*.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
