import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { saveReelVideo } from "@/lib/upload/local";

export const runtime = "nodejs";
// Video gövdeleri büyük olabildiği için varsayılan süre yetmeyebilir.
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/**
 * Sert üst sınır. Supabase bucket sınırı 25 MB'a çekildi; buradaki 20 MB
 * ondan önce devreye girer, böylece kullanıcı depolama katmanının İngilizce
 * hatası yerine anlaşılır bir mesaj görür.
 */
const MAX_BYTES = 20 * 1024 * 1024;

const MB = 1024 * 1024;

/**
 * Dosya, `multipart/form-data` yerine HAM GÖVDE olarak alınır.
 * Dosya adı `x-file-name` başlığında URL-encoded gelir; MIME `content-type`ta.
 *
 * Asıl 10 MB duvarı `src/proxy.ts`ti: gövde proxy üzerinden geçerken tam
 * 10485760 baytta kesiliyordu (ölçüldü: 9.5 MB geçiyor, 10 MB geçmiyor).
 * Kırpılan multipart gövde de ayrıştırılamadığı için hata "Failed to parse
 * body as FormData" olarak görünüyordu. Proxy matcher'ından `api/` çıkarıldı.
 *
 * Ham gövde yine de tercih ediliyor: çok parçalı sarmalama olmadan bir kopya
 * daha az bellek, bir de aşağıdaki content-length karşılaştırması sayesinde
 * eksik gelen gövde sessizce kaydedilmiyor.
 */
const FILENAME_HEADER = "x-file-name";

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

/** Başlıktaki dosya adını çözer; bozuk kodlamada güvenli bir ada düşer. */
function decodeFilename(raw: string | null): string {
  if (!raw) return "reel.mp4";
  try {
    return decodeURIComponent(raw).slice(0, 120) || "reel.mp4";
  } catch {
    return "reel.mp4";
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const mimeType = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!ALLOWED_TYPES.has(mimeType)) {
    return badRequest("Yalnızca MP4, WEBM veya MOV video yüklenebilir.");
  }

  // Gövdeyi belleğe almadan önce reddet — aksi halde devasa bir istek
  // sırf sınırı öğrenmek için tamamen okunmuş olurdu.
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return badRequest(`Video en fazla 20 MB olabilir. Seçilen dosya ${(declared / MB).toFixed(1)} MB.`);
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await req.arrayBuffer();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[reels/upload] gövde okunamadı:", reason);
    return badRequest("Dosya sunucuya eksiksiz ulaşmadı, tekrar deneyin.");
  }

  if (buffer.byteLength === 0) return badRequest("Dosya boş.");
  // content-length yalan söylemiş olabilir; gerçek boyutu da doğrula.
  if (buffer.byteLength > MAX_BYTES) {
    return badRequest(`Video en fazla 20 MB olabilir. Seçilen dosya ${(buffer.byteLength / MB).toFixed(1)} MB.`);
  }

  /**
   * Gövde kırpılmışsa YARIM dosyayı kaydetme.
   *
   * Proxy kaynaklı kesilmede istek 200 dönüyor ama depoya bozuk, oynatılamaz
   * bir video yazılıyordu. Bildirilen uzunlukla gelen bayt sayısını
   * karşılaştırmak bu sessiz bozulmayı görünür bir hataya çeviriyor.
   */
  if (Number.isFinite(declared) && declared > 0 && buffer.byteLength !== declared) {
    console.error(
      `[reels/upload] gövde eksik: beklenen ${declared}, gelen ${buffer.byteLength}`,
    );
    return badRequest(
      `Dosya sunucuya eksiksiz ulaşmadı (${(buffer.byteLength / MB).toFixed(1)}/${(declared / MB).toFixed(1)} MB). ` +
      `Videoyu küçültüp tekrar deneyin.`,
    );
  }
  if (!hasVideoSignature(new Uint8Array(buffer))) {
    return badRequest("Dosya geçerli bir video değil.");
  }

  const filename = decodeFilename(req.headers.get(FILENAME_HEADER));

  try {
    const url = await saveReelVideo(buffer, filename);
    return ok({ url, filename, size: buffer.byteLength, mimeType });
  } catch (err) {
    // Depolama katmanının gerçek sebebini kaydet — aksi halde panelde
    // "yükleme sırasında hata oluştu" dışında hiçbir iz kalmıyor.
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[reels/upload] video yüklenemedi:", reason);
    return serverError(`Video yüklenemedi: ${reason}`);
  }
}
