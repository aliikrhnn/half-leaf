/**
 * Hero ve ürün görseli yükleme — Supabase Storage backend.
 *
 * Dışa açılan imzalar (buffer, originalName) → Promise<string> değişmedi;
 * çağıran route'lar ve testler bu modüle bağlıdır, onlara dokunmak gerekmez.
 */

import path from "path";
import { getStorageClient, BUCKET, storagePublicUrl } from "@/lib/storage/supabase";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function contentTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Hero görselini Supabase Storage'a yükler ve public URL döndürür.
 * @param buffer       - Ham görsel baytları
 * @param originalName - İstemciden gelen dosya adı (uzantı + slug için)
 * @returns Supabase CDN public URL
 */
export async function saveHeroImage(
  buffer: ArrayBuffer,
  originalName: string,
): Promise<string> {
  const ext  = path.extname(originalName).toLowerCase() || ".webp";
  const base = path.basename(originalName, ext);
  const slug = slugify(base);
  const tag  = Date.now().toString(36);
  const filename    = `${slug}-${tag}${ext}`;
  const storagePath = `hero/${filename}`;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(buffer), {
      contentType: contentTypeFromExt(ext),
      upsert: true,
    });

  if (error) throw new Error(`Görsel yüklenemedi: ${error.message}`);
  return storagePublicUrl(storagePath);
}

/**
 * Ürün reel videosunu (dikey MP4) Supabase Storage'a yükler.
 * @param buffer       - Ham video baytları
 * @param originalName - İstemciden gelen dosya adı
 * @returns Supabase CDN public URL
 */
export async function saveReelVideo(
  buffer: ArrayBuffer,
  originalName: string,
): Promise<string> {
  const ext  = path.extname(originalName).toLowerCase() || ".mp4";
  const base = path.basename(originalName, ext);
  const slug = slugify(base) || "reel";
  const tag  = Date.now().toString(36);
  const storagePath = `reels/${slug}-${tag}${ext}`;

  // .mov'u video/mp4 olarak etiketlemek Safari dışında oynatma sorunu çıkarıyor.
  const videoTypes: Record<string, string> = {
    ".webm": "video/webm",
    ".mov":  "video/quicktime",
  };

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(buffer), {
      contentType: videoTypes[ext] ?? "video/mp4",
      upsert: true,
    });

  if (error) throw new Error(error.message);
  return storagePublicUrl(storagePath);
}

/**
 * Ürün görselini Supabase Storage'a yükler ve public URL döndürür.
 * @param buffer       - Ham görsel baytları
 * @param originalName - İstemciden gelen dosya adı
 * @returns Supabase CDN public URL
 */
export async function saveProductImage(
  buffer: ArrayBuffer,
  originalName: string,
): Promise<string> {
  const ext  = path.extname(originalName).toLowerCase() || ".jpg";
  const tag  = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  const filename    = `prod_${rand}_${tag}${ext}`;
  const storagePath = `products/originals/${filename}`;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(buffer), {
      contentType: contentTypeFromExt(ext),
      upsert: true,
    });

  if (error) throw new Error(`Görsel yüklenemedi: ${error.message}`);
  return storagePublicUrl(storagePath);
}
