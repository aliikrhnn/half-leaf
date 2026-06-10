import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rikoawvhezkofzahamzf.supabase.co",
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
          // TODO (deploy): Content-Security-Policy eklenecek.
          // Önce raporlama modunda başlatılmalı:
          //   Content-Security-Policy-Report-Only: default-src 'self'; report-uri /api/csp-report
          // Uyumlu hale geldikten sonra zorlayıcı moda (Content-Security-Policy) geçilecek.
        ],
      },
    ];
  },
};

export default nextConfig;
