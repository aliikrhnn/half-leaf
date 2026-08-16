/**
 * Doğrudan yüklenen reel videosunu onaylar.
 *
 * Dosya tarayıcıdan Supabase'e gittiği için sunucu onu hiç görmedi. Burada
 * ilk 12 bayt Range isteğiyle çekilip boyut ve video imzası doğrulanır;
 * geçersizse nesne silinir. Böylece doğrudan yüklemeye geçmek, önceki
 * sunucu taraflı doğrulamalardan hiçbirini kaybettirmez.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { getStorageClient, BUCKET, storagePublicUrl } from "@/lib/storage/supabase";
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_MB,
  isReelStoragePath,
  hasVideoSignature,
} from "@/lib/upload/reel-video";

export const runtime = "nodejs";

const Schema = z.object({ path: z.string().trim().min(1).max(200) });

/** `content-range: bytes 0-11/12582912` → 12582912 */
function totalFromContentRange(header: string | null): number | null {
  const total = header?.split("/")[1];
  const parsed = Number(total);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function discard(storagePath: string) {
  try {
    await getStorageClient().storage.from(BUCKET).remove([storagePath]);
  } catch (err) {
    // Silme başarısız olsa da isteği reddetmeye devam ediyoruz; yetim dosya
    // görünmez (hiçbir reel ona işaret etmiyor) ama iz bırakalım.
    console.error("[reels/upload-verify] geçersiz dosya silinemedi:", storagePath, err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz dosya yolu.");

  const storagePath = parsed.data.path;
  if (!isReelStoragePath(storagePath)) return badRequest("Geçersiz dosya yolu.");

  const publicUrl = storagePublicUrl(storagePath);

  let head: Response;
  try {
    head = await fetch(publicUrl, {
      headers: { Range: "bytes=0-11" },
      cache: "no-store",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[reels/upload-verify] dosya okunamadı:", reason);
    return serverError("Yüklenen dosya doğrulanamadı, tekrar deneyin.");
  }

  if (!head.ok) {
    return badRequest("Yüklenen dosya bulunamadı. Yüklemeyi tekrarlayın.");
  }

  const size =
    totalFromContentRange(head.headers.get("content-range")) ??
    Number(head.headers.get("content-length"));

  if (Number.isFinite(size) && size > MAX_VIDEO_BYTES) {
    await discard(storagePath);
    const mb = (size / 1024 / 1024).toFixed(1);
    return badRequest(`Video en fazla ${MAX_VIDEO_MB} MB olabilir. Yüklenen dosya ${mb} MB.`);
  }

  const firstBytes = new Uint8Array(await head.arrayBuffer());
  if (!hasVideoSignature(firstBytes)) {
    await discard(storagePath);
    return badRequest("Dosya geçerli bir video değil.");
  }

  return ok({ url: publicUrl, path: storagePath, size: Number.isFinite(size) ? size : null });
}
