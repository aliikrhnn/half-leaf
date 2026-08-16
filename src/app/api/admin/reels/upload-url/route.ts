/**
 * Reel videosu için imzalı yükleme adresi üretir.
 *
 * Dosyanın kendisi bu uçtan geçmez; tarayıcı döndürülen `signedUrl`e doğrudan
 * yükler. Vercel'in 4.5 MB'lık gövde sınırı böylece devreden çıkar
 * (bkz. lib/upload/reel-video.ts).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { getStorageClient, BUCKET, storagePublicUrl } from "@/lib/storage/supabase";
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_MB,
  buildReelStoragePath,
} from "@/lib/upload/reel-video";

export const runtime = "nodejs";

const Schema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.enum(ALLOWED_VIDEO_TYPES),
  size: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Yalnızca MP4, WEBM veya MOV video yüklenebilir.");
  }
  const { filename, contentType, size } = parsed.data;

  if (size > MAX_VIDEO_BYTES) {
    const mb = (size / 1024 / 1024).toFixed(1);
    return badRequest(`Video en fazla ${MAX_VIDEO_MB} MB olabilir. Seçilen dosya ${mb} MB.`);
  }

  // Yol sunucuda üretilir; istemcinin verdiği ad yalnızca okunabilirlik için.
  const storagePath = buildReelStoragePath(filename, contentType);

  try {
    const supabase = getStorageClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      const reason = error?.message ?? "imzalı adres alınamadı";
      console.error("[reels/upload-url] imzalama başarısız:", reason);
      return serverError(`Yükleme adresi alınamadı: ${reason}`);
    }

    return ok({
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
      publicUrl: storagePublicUrl(storagePath),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[reels/upload-url] beklenmeyen hata:", reason);
    return serverError(`Yükleme adresi alınamadı: ${reason}`);
  }
}
