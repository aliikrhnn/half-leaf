import type { NextConfig } from "next";

/**
 * Görsellerin geldiği Supabase host'u — ortam değişkeninden türetilir.
 * Değişken yoksa (yerel geliştirme) hiçbir uzak host'a izin verilmez.
 */
function resolveSupabaseHost(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "invalid.localhost";
  try {
    return new URL(raw).hostname;
  } catch {
    return "invalid.localhost";
  }
}

const supabaseHost = resolveSupabaseHost();

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    // AVIF/WebP ile otomatik daha küçük görsel (daha hızlı LCP, daha az bant genişliği).
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        // YALNIZCA bu projenin Supabase örneği. "*.supabase.co" jokeri
        // dünyadaki her Supabase projesini kapsıyordu; bu da /_next/image
        // uç noktasını herkesin kullanabileceği bir görsel proxy'si
        // (bant genişliği + CPU suistimali) hâline getiriyordu.
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    /*
     * Ödeme rotaları için başlıklar AYRIŞTIRILDI.
     *
     * Sebep: PayTR iFrame akışında (a) 3D Secure adımında iframe, kartın
     * bankasının ACS adresine gider ve (b) ödeme bitince PayTR, iframe'in
     * İÇİNDE `merchant_ok_url`'e yönlenir. Tek ve katı bir politika bu iki
     * adımı da engelliyordu: `frame-src` bankaları, `X-Frame-Options: DENY` +
     * `frame-ancestors 'none'` ise kendi dönüş sayfamızı bloke ediyor,
     * müşteri kart bilgisini girdikten sonra BEYAZ EKRANDA kalıyordu.
     *
     * Gevşetme yalnızca iki yola uygulanır; sitenin geri kalanı aynen katı
     * kalır.
     */
    const commonHeaders = [
      {
        // 2 yıl HSTS; preload listine eklenmek için ayrı başvuru süreci gerekir
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        // Tarayıcının MIME sniffing yapmasını engeller
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        // Cross-origin geçişlerde yalnızca origin bilgisi paylaşılır
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        // Kullanılmayan tarayıcı API'lerini kapat
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
    ];

    const denyFraming = {
      // Clickjacking koruması: site hiçbir iframe içine alınamaz
      key: "X-Frame-Options",
      value: "DENY",
    };

    return [
      {
        /*
         * Genel kural — ödeme köprü rotaları HARİÇ. Next.js aynı yola uyan
         * TÜM kuralların başlıklarını eklediği için, gevşek politikanın
         * geçerli olabilmesi adına bu rotaların genel kuralın dışında
         * bırakılması şarttır (iki CSP başlığı gönderilirse tarayıcı ikisinin
         * KESİŞİMİNİ uygular ve gevşetme hiçbir işe yaramaz).
         */
        source: "/((?!odeme/paytr|odeme/donus).*)",
        headers: [
          ...commonHeaders,
          denyFraming,
          {
            /*
             * CSP — ZORLAYICI mod (önceden yalnızca Report-Only idi, yani
             * tarayıcı hiçbir şeyi engellemiyordu ve rapor adresi de yoktu:
             * politika fiilen ölü koddu).
             *
             * `script-src 'unsafe-inline'` BİLİNÇLİ olarak korunuyor: onu
             * kaldırmak tüm satır içi script'lerin nonce almasını gerektirir,
             * bu da (a) nonce'u okumak için her sayfayı dinamik render'a
             * zorlar (ISR kaybı) ve (b) JSON-LD yapısal verisini kırma riski
             * taşır. Buna karşılık script/bağlantı/görsel KAYNAKLARI
             * daraltıldı: bir XSS bulunsa bile dışarıya veri sızdırmak ve
             * harici script yüklemek engellenir.
             */
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              /*
               * 'unsafe-eval' YALNIZCA geliştirmede: React'in dev derlemesi
               * eval() kullanıyor ve zorlayıcı CSP onu engelleyince sayfa hiç
               * hidrate olmuyordu — `npm run dev` ile site tamamen etkileşimsiz
               * kalıyor, video/karusel gibi istemci mantığı hiç çalışmıyordu.
               * Üretim derlemesinde eval kullanılmadığı için orada eklenmiyor.
               */
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.paytr.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://placehold.co",
              // Reel videoları Supabase Storage'dan gelir; 'self' onları engelliyordu.
              // Joker yerine bu projenin host'u — başka bir Supabase örneğinden
              // medya yüklenmesine gerek yok.
              `media-src 'self' blob: https://${supabaseHost}`,
              // PayTR ödeme iframe'i + mağaza konumu için Google Haritalar gömmesi
              "frame-src https://www.paytr.com https://www.google.com https://maps.google.com",
              "connect-src 'self' https://*.supabase.co https://www.paytr.com",
              "form-action 'self' https://www.paytr.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "report-uri /api/csp-report",
            ].join("; "),
          },
        ],
      },

      {
        /*
         * PayTR güvenli ödeme sayfası (/odeme/paytr/...).
         *
         * `frame-src` neden `https:`? 3D Secure adımında PayTR iframe'i,
         * kartı veren bankanın ACS adresine yönlenir. Türkiye'de onlarca banka
         * ve sürekli değişen ACS alan adı var; sabit bir liste ödemeleri
         * rastgele kırar. Bu yol yalnızca sipariş sahibinin erişebildiği,
         * indekslenmeyen, kullanıcı içeriği barındırmayan bir ödeme sayfasıdır;
         * gevşetme buraya sınırlı tutulmuştur.
         */
        source: "/odeme/paytr/:path*",
        headers: [
          ...commonHeaders,
          denyFraming,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.paytr.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://placehold.co",
              `media-src 'self' blob: https://${supabaseHost}`,
              // PayTR + 3D Secure banka sayfaları + kendi dönüş köprümüz ('self')
              "frame-src 'self' https:",
              "connect-src 'self' https://*.supabase.co https://www.paytr.com",
              "form-action 'self' https:",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "report-uri /api/csp-report",
            ].join("; "),
          },
        ],
      },

      {
        /*
         * Ödeme dönüş köprüsü (/odeme/donus).
         *
         * PayTR ödeme bitince iframe'i bu adrese yönlendirir; sayfa tek işi
         * yapar: üst pencereyi gerçek sonuç sayfasına taşır. Bu yüzden BU yol
         * — ve yalnızca bu yol — paytr.com tarafından çerçevelenebilmelidir:
         * `X-Frame-Options` gönderilmez, `frame-ancestors` yalnızca PayTR'a
         * izin verir. Sayfa hiçbir müşteri verisi göstermez, bu nedenle
         * clickjacking açısından değeri yoktur.
         */
        source: "/odeme/donus",
        headers: [
          ...commonHeaders,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'none'",
              "script-src 'unsafe-inline'",
              "style-src 'unsafe-inline'",
              "frame-ancestors https://www.paytr.com",
              "base-uri 'none'",
              "form-action 'none'",
              "report-uri /api/csp-report",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
