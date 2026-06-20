import type { NextConfig } from "next";

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
        // Tüm Supabase proje alt alan adları (yüklenen ürün görselleri).
        protocol: "https",
        hostname: "*.supabase.co",
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
            // CSP — önce Report-Only (siteyi kırmadan ihlalleri tespit eder).
            // Uyum doğrulandıktan sonra "Content-Security-Policy" olarak zorlayıcı moda geçilebilir.
            // PayTR ödeme iframe'i (frame-src/script-src/form-action https://www.paytr.com),
            // Supabase görselleri ve Google Fonts izinlidir.
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.paytr.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "frame-src https://www.paytr.com",
              "connect-src 'self' https://*.supabase.co https://www.paytr.com",
              "form-action 'self' https://www.paytr.com",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
