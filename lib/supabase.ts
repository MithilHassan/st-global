import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily creates the Supabase client on first use (browser only). Throws a
 * clear error instead of a cryptic one if the env vars haven't been set,
 * so the booking/tracking pages can catch it and show a friendly message.
 */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server."
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(url, key);
  }
  return cachedClient;
}
