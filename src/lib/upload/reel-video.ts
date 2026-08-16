/**
 * Reel videosu yükleme kuralları.
 *
 * Video, Vercel fonksiyonundan GEÇMEZ: tarayıcı imzalı URL ile doğrudan
 * Supabase Storage'a yükler. Sebep, Vercel'in istek gövdelerini 4.5 MB'ta
 * FUNCTION_PAYLOAD_TOO_LARGE ile kesmesi — bu sınır fonksiyon çalışmadan önce
 * devreye girdiği için kod tarafından yükseltilemiyor.
 *
 * Bu modül iki ucun (imzala / doğrula) ortak kurallarını tutar.
 */

/** Yalnızca bu türler kabul edilir. */
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export type AllowedVideoType = (typeof ALLOWED_VIDEO_TYPES)[number];

export const MAX_VIDEO_MB = 20;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

/** Depolama yolundaki uzantı, kullanıcının dosya adından değil MIME'dan gelir. */
const EXT_BY_TYPE: Record<AllowedVideoType, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export function isAllowedVideoType(value: string): value is AllowedVideoType {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(value);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Depolama yolunu SUNUCUDA üretir — istemciden gelen ada güvenilmez.
 * Uzantı doğrulanmış MIME'dan geldiği için ".php" gibi bir ad yol açamaz.
 */
export function buildReelStoragePath(originalName: string, type: AllowedVideoType): string {
  const base = originalName.replace(/\.[^.]*$/, "");
  const slug = slugify(base) || "reel";
  const tag = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `reels/${slug}-${tag}${rand}${EXT_BY_TYPE[type]}`;
}

/**
 * Doğrulama ucunun yalnızca kendi klasörüne bakmasını garantiler; başka bir
 * depolama nesnesinin (ör. ürün görselleri) reel videosu diye onaylanmasını
 * ve yol kaçışını engeller.
 */
export function isReelStoragePath(value: string): boolean {
  return (
    value.startsWith("reels/") &&
    !value.includes("..") &&
    !value.includes("//") &&
    value.length <= 200
  );
}

/**
 * MP4/MOV (ISO-BMFF) dosyaları 4. bayttan itibaren "ftyp" içerir,
 * WebM ise 1A 45 DF A3 (EBML) ile başlar. Uzantıya/MIME'a güvenmeyip
 * içeriği doğruluyoruz — sahte uzantılı dosya yüklenmesin.
 */
export function hasVideoSignature(buf: Uint8Array): boolean {
  if (buf.length < 12) return false;
  const isFtyp =
    buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
  const isEbml =
    buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  return isFtyp || isEbml;
}
