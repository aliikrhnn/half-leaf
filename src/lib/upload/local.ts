/**
 * Local-filesystem image storage (hero + product images).
 *
 * PRODUCTION NOTE: public/ is not writable on Vercel/serverless runtimes.
 * To migrate to Vercel Blob, replace this entire file with a Blob-backed
 * implementation that exports the same `saveHeroImage` signature.
 * No other file needs to change.
 *
 * NOT (deploy turunda yapılacak): Bu modül public/uploads dizinine dosya yazar.
 * Vercel/serverless ortamında public klasörü salt okunurdur; production'a
 * geçişten önce saveHeroImage fonksiyonu Vercel Blob veya Supabase Storage'a
 * göçecek. İmza (buffer, originalName) → Promise<string> aynı kalmalı ki
 * çağıran yerler etkilenmesin.
 */

import fs   from "fs/promises";
import path from "path";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Saves an uploaded hero image to public/uploads/hero/ and returns the public URL.
 * @param buffer  - Raw file bytes
 * @param originalName - Original filename from the client (used for extension + slug)
 * @returns  "/uploads/hero/<filename>" — served as a static asset by Next.js
 */
export async function saveHeroImage(
  buffer: ArrayBuffer,
  originalName: string,
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "hero");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext  = path.extname(originalName).toLowerCase() || ".webp";
  const base = path.basename(originalName, ext);
  const slug = slugify(base);
  const tag  = Date.now().toString(36);
  const filename = `${slug}-${tag}${ext}`;

  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(buffer));

  return `/uploads/hero/${filename}`;
}

/**
 * Saves an uploaded product image to public/uploads/products/originals/ and returns the public URL.
 * @param buffer  - Raw file bytes
 * @param originalName - Original filename from the client
 * @returns  "/uploads/products/originals/<filename>"
 */
export async function saveProductImage(
  buffer: ArrayBuffer,
  originalName: string,
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products", "originals");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext  = path.extname(originalName).toLowerCase() || ".jpg";
  const tag  = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  const filename = `prod_${rand}_${tag}${ext}`;

  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(buffer));

  return `/uploads/products/originals/${filename}`;
}
