import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Admin-privileged Supabase client for the /api/admin/* route handlers only.
 * Uses the service role key, which bypasses Row Level Security entirely —
 * it must never be imported into a "use client" component or exposed as a
 * NEXT_PUBLIC_ env var.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Admin Supabase client is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your server environment (Project Settings -> API -> service_role key in Supabase)."
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}
