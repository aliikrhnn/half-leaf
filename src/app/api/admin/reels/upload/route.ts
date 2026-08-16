import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { saveReelVideo } from "@/lib/upload/local";

export const runtime = "nodejs";
// Video gövdeleri büyük olabildiği için varsayılan süre yetmeyebilir.
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/** Sert üst sınır. Önerilen boyut 8 MB (bkz. public/reels/README.md). */
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * MP4/MOV (ISO-BMFF) dosyaları 4. bayttan itibaren "ftyp" içerir,
 * WebM ise 1A 45 DF A3 (EBML) ile başlar. Uzantıya/MIME'a güvenmeyip
 * içeriği doğruluyoruz — sahte uzantılı dosya yüklenmesin.
 */
function hasVideoSignature(buf: Uint8Array): boolean {
  if (buf.length < 12) return false;
  const isFtyp =
    buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
  const isEbml =
    buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  return isFtyp || isEbml;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("Geçersiz form verisi.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return badRequest("'file' alanı eksik.");

  if (!ALLOWED_TYPES.has(file.type)) {
    return badRequest("Yalnızca MP4, WEBM veya MOV video yüklenebilir.");
  }
  if (file.size > MAX_BYTES) {
    return badRequest("Video en fazla 20 MB olabilir (önerilen: 8 MB altı).");
  }

  const buffer = await file.arrayBuffer();
  if (!hasVideoSignature(new Uint8Array(buffer))) {
    return badRequest("Dosya geçerli bir video değil.");
  }

  try {
    const url = await saveReelVideo(buffer, file.name);
    return ok({ url, filename: file.name, size: file.size, mimeType: file.type });
  } catch {
    return serverError();
  }
}
