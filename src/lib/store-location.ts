/**
 * Mağaza konumu — adres metninden Google Haritalar bağlantısı ve gömülü harita
 * URL'si üretir.
 *
 * Yönetim panelinden `mapsUrl` / `mapEmbedUrl` girilirse onlar kullanılır;
 * girilmezse adres metninden otomatik üretilir. Böylece hiçbir ayar yapılmadan
 * da harita çalışır, ama tam konum istendiğinde admin kesin bağlantıyı
 * yapıştırabilir.
 */

export interface StoreLocation {
  /** Adres satırları — boş satırlar temizlenmiş halde. */
  lines: string[];
  /** Tek satıra indirgenmiş adres (arama sorgusu ve schema.org için). */
  singleLine: string;
  /** "Yol tarifi al" bağlantısı — yeni sekmede Google Haritalar'ı açar. */
  mapsUrl: string;
  /** <iframe src> — gömülü harita. */
  embedUrl: string;
  /** Şehir (varsa) — schema.org PostalAddress için. */
  locality: string;
  /** Ülke — schema.org PostalAddress için. */
  country: string;
}

const DEFAULT_COUNTRY = "Türkiye";

/** Adres metnini satırlara böler, fazla boşlukları temizler. */
function toLines(address: string): string[] {
  return address
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);
}

/**
 * Google Haritalar gömme URL'sinin geçerli olup olmadığını doğrular.
 * Yalnızca google host'larındaki gömme uçlarını kabul eder — yönetim
 * panelinden yanlış/kötü niyetli bir URL yapıştırılırsa iframe'e düşmesin.
 */
function isSafeEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    const okHost =
      host === "www.google.com" ||
      host === "maps.google.com" ||
      host === "www.google.com.tr" ||
      /^(www\.)?google\.[a-z.]+$/.test(host);
    if (!okHost) return false;
    return u.pathname.startsWith("/maps/embed") || u.searchParams.get("output") === "embed";
  } catch {
    return false;
  }
}

/** Yönetim panelinden gelen "Yol tarifi" bağlantısını doğrular. */
function isSafeMapsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "goo.gl" ||
      host === "maps.app.goo.gl" ||
      /^(www\.|maps\.)?google\.[a-z.]+$/.test(host)
    );
  } catch {
    return false;
  }
}

export function buildStoreLocation(
  address: string,
  mapsUrl?: string | null,
  mapEmbedUrl?: string | null,
  /** Google Haritalar'a kayıtlı işletme adı. */
  businessName?: string
): StoreLocation {
  const lines = toLines(address);
  const singleLine = lines.join(", ");

  const localityLine = lines.find((l) => /türkiye|turkey/i.test(l)) ?? "";
  const locality = localityLine.split(",")[0]?.trim() ?? "";

  /*
   * Sorgu İŞLETME ADIYLA başlar.
   *
   * Yalnızca açık adresle arandığında Google haritada iğneyi adresin son
   * parçasıyla ("Dükkan 2") etiketliyordu. İşletme Google Haritalar'a kayıtlı
   * olduğu için ad + adres birlikte gönderildiğinde kayıtlı işletme kaydı
   * eşleşir ve iğne "Half Leaf" olarak görünür.
   *
   * Kesin sonuç için yönetim panelinden `mapsUrl` / `mapEmbedUrl` alanlarına
   * Google Haritalar'daki gerçek yer bağlantısı yapıştırılabilir; girilirse
   * bu üretilen sorgu hiç kullanılmaz.
   */
  const name = businessName?.trim();
  const queryText = [name, singleLine].filter(Boolean).join(", ") || DEFAULT_COUNTRY;
  const query = encodeURIComponent(queryText);

  const trimmedMaps = mapsUrl?.trim();
  const trimmedEmbed = mapEmbedUrl?.trim();

  return {
    lines,
    singleLine,
    locality,
    country: DEFAULT_COUNTRY,
    mapsUrl:
      trimmedMaps && isSafeMapsUrl(trimmedMaps)
        ? trimmedMaps
        : `https://www.google.com/maps/search/?api=1&query=${query}`,
    embedUrl:
      trimmedEmbed && isSafeEmbedUrl(trimmedEmbed)
        ? trimmedEmbed
        : `https://maps.google.com/maps?q=${query}&z=16&hl=tr&output=embed`,
  };
}
