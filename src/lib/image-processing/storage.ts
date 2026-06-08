/**
 * İşlenmiş ürün görseli depolama — Supabase Storage backend.
 *
 * Dışa açılan imzalar değişmedi:
 *   saveProcessedImage(buffer, productImageId) → Promise<string>
 *   deleteProcessedImage(url)                  → Promise<void>
 * Çağıran route'lar ve worker bu modüle bağlıdır, onlara dokunmak gerekmez.
 */

import {
  getStorageClient,
  BUCKET,
  storagePublicUrl,
  storagePathFromUrl,
} from "@/lib/storage/supabase";

export async function saveProcessedImage(
  buffer: Buffer,
  productImageId: string
): Promise<string> {
  const timestamp   = Date.now();
  const filename    = `pi_${productImageId}_${timestamp}.png`;
  const storagePath = `products/processed/${filename}`;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) throw new Error(`İşlenmiş görsel yüklenemedi: ${error.message}`);
  return storagePublicUrl(storagePath);
}

export async function deleteProcessedImage(url: string): Promise<void> {
  const storagePath = storagePathFromUrl(url);
  if (!storagePath) return;

  const supabase = getStorageClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
  // Silme hatası kritik değil; çağıran temizliği yönetir.
}
