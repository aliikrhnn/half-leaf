import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { saveHeroImage } from "@/lib/upload/local";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Checks the first bytes of the buffer against known image magic numbers. */
function hasImageSignature(buf: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;
  // AVIF / HEIF: ????ftyp
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true;
  return false;
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
    return badRequest("Yalnızca JPG, PNG, WEBP veya AVIF görsel formatları kabul edilmektedir.");
  }

  if (file.size > MAX_BYTES) {
    return badRequest("Dosya boyutu en fazla 5 MB olabilir.");
  }

  const buffer = await file.arrayBuffer();
  const bytes  = new Uint8Array(buffer);

  if (bytes.length < 12 || !hasImageSignature(bytes)) {
    return badRequest("Dosya geçerli bir görsel değil.");
  }

  try {
    const url = await saveHeroImage(buffer, file.name);
    return ok({ url, filename: file.name, size: file.size, mimeType: file.type });
  } catch {
    return serverError();
  }
}
