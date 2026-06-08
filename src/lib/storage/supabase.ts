import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "halfleaf-uploads" as const;

let _client: SupabaseClient | null = null;

export function getStorageClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env değişkenleri tanımlı olmalı."
      );
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/** Supabase Storage'daki bir path için halka açık CDN URL'ini döndürür. */
export function storagePublicUrl(storagePath: string): string {
  const supabase = getStorageClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Supabase public URL'inden storage path'ini çıkarır.
 * `/uploads/...` gibi eski yerel URL'ler için null döndürür.
 */
export function storagePathFromUrl(publicUrl: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  if (!publicUrl.startsWith(prefix)) return null;
  return publicUrl.slice(prefix.length);
}
