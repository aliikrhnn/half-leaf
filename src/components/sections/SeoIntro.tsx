import Link from "next/link";

/**
 * Ana sayfa SEO içerik bölümü — doğal anahtar kelime kullanımı + kategori iç-linkleri.
 * Hedef aramalar: nargile, nargile takımı, lüle, ithal/yerli takım, cam şişe, kömür, aksesuar.
 */
const CATEGORY_LINKS: { label: string; href: string }[] = [
  { label: "Nargile Takımları", href: "/kategori/nargile-takimlari" },
  { label: "İthal Takımlar", href: "/kategori/ithal-takimlar" },
  { label: "Yerli Takımlar", href: "/kategori/yerli-takimlar" },
  { label: "Lüleler", href: "/kategori/luler" },
  { label: "Cam Şişeler", href: "/kategori/siseler" },
  { label: "Kömürler", href: "/kategori/komurler" },
  { label: "Aksesuarlar", href: "/kategori/aksesuarlar" },
];

export default function SeoIntro() {
  return (
    <section
      aria-labelledby="seo-intro-heading"
      style={{
        background: "var(--hl-bg)",
        borderTop: "1px solid var(--hl-line)",
        padding: "clamp(48px, 7vw, 88px) 24px",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "var(--hl-bronze-400)", marginBottom: 14,
        }}>
          Half Leaf Koleksiyonu
        </p>
        <h2
          id="seo-intro-heading"
          style={{
            fontFamily: "var(--hl-font-display)", fontSize: "clamp(24px, 3.2vw, 38px)",
            fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)",
            lineHeight: 1.2, margin: "0 0 20px",
          }}
        >
          Nargile Takımı, Lüle, Cam Şişe ve Nargile Aksesuarları
        </h2>
        <p style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 14, lineHeight: 1.85,
          color: "var(--hl-text-mute)", margin: "0 auto 14px", maxWidth: 760,
        }}>
          Half Leaf; <strong style={{ color: "var(--hl-text-soft)" }}>ithal ve yerli nargile takımları</strong>,
          rus tipi takımlar, lüleler, çelik ve cam şişeler, nargile camı, kömürler, marpuçlar ve tüm
          nargile aksesuarlarını tek çatı altında sunar. Darkside, Amotion, Moze, Alpha, Blade, Hug ve
          Geometry gibi öne çıkan markaların premium ürünlerini güvenli ödeme ve hızlı kargo ile keşfedin.
        </p>
        <p style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 14, lineHeight: 1.85,
          color: "var(--hl-text-mute)", margin: "0 auto 28px", maxWidth: 760,
        }}>
          İster yeni başlayın ister koleksiyonunuzu büyütün — takımdan lüleye, şişeden köze kadar
          ihtiyacınız olan her şey özenle seçilmiş kategorilerimizde.
        </p>
        <nav aria-label="Kategoriler" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              style={{
                display: "inline-block", fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 600,
                color: "var(--hl-text-soft)", textDecoration: "none", padding: "8px 16px",
                borderRadius: "var(--hl-r-pill)", border: "1px solid var(--hl-line-strong)",
              }}
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
