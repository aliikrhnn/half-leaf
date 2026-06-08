/**
 * Processed image storage — local filesystem.
 *
 * DEPLOY NOTE: public/ is read-only on Vercel/serverless.
 * Replace this file with a Vercel Blob / Supabase Storage implementation
 * that exports the same `saveProcessedImage` and `deleteProcessedImage`
 * signatures. No other file needs to change.
 */

import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products",
  "processed"
);

export async function saveProcessedImage(
  buffer: Buffer,
  productImageId: string
): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const timestamp = Date.now();
  const filename = `pi_${productImageId}_${timestamp}.png`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return `/uploads/products/processed/${filename}`;
}

export async function deleteProcessedImage(url: string): Promise<void> {
  if (!url.startsWith("/uploads/products/processed/")) return;
  const filename = path.basename(url);
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be gone; not fatal
  }
}
