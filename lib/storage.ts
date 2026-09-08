import "server-only";
import { getSupabaseAdminClient } from "./supabaseAdmin";

const BUCKET = "site-assets";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function ensureBucket(): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  // Ignore "already exists" races — two concurrent first-uploads is fine.
  await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES });
}

/**
 * Uploads the hero image to a fixed path (overwriting any previous one,
 * so we don't accumulate orphaned files across re-uploads) and returns
 * its public URL.
 */
export async function uploadHeroImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, WEBP or GIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is too large — please keep it under 8MB.");
  }

  await ensureBucket();
  const supabase = getSupabaseAdminClient();
  const ext = file.type.split("/")[1] || "jpg";
  const path = `hero/hero.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the new image shows immediately instead of a stale
  // cached copy at the same URL.
  return `${data.publicUrl}?v=${Date.now()}`;
}
