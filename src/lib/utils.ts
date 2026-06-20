export function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * JSON-LD verisini güvenli şekilde <script> içine basmak için serialize eder.
 * `<`, `>`, `&` karakterlerini unicode-escape ederek "</script>" breakout'unu
 * ve XSS'i önler. dangerouslySetInnerHTML ile birlikte kullanılır.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function calculateDiscount(
  price: number,
  compareAtPrice: number
): number {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
