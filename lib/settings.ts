import "server-only";
import { getSupabaseAdminClient } from "./supabaseAdmin";

/** Reads one row from app_settings. Returns null if unset or on any error
 * (e.g. the migration hasn't been run yet) — callers should fall back to
 * an environment variable in that case rather than fail. */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
