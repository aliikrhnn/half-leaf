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
    return [
      {
        // Tüm rotalar için güvenlik başlıkları
        source: "/(.*)",
        headers: [
          {
            // 2 yıl HSTS; preload listine eklenmek için ayrı başvuru süreci gerekir
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Clickjacking koruması: site hiçbir iframe içine alınamaz
            key: "X-Frame-Options",
            value: "DENY",
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
              "script-src 'self' 'unsafe-inline' https://www.paytr.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://placehold.co",
              "media-src 'self'",
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
    ];
  },
};

export default nextConfig;
