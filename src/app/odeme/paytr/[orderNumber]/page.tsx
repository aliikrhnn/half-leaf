import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { canViewOrder } from "@/lib/orders/access";
import { formatPrice } from "@/lib/utils";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import PayTrLogo from "@/components/layout/PayTrLogo";
import CardSchemes from "@/components/layout/CardSchemes";
import {
  iframeUrl,
  getSiteBaseUrl,
  normalizeUserIp,
  type BasketLine,
} from "@/lib/payment/paytr";
import { getOrCreateIframeToken } from "@/lib/payment/iframe-token";
import { rateLimiter } from "@/lib/rate-limit/limiter";
import PaytrFrame from "./PaytrFrame";

export const metadata: Metadata = {
  title: "Güvenli Ödeme",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}

interface ShippingAddressShape {
  fullName?: string;
  phone?: string;
  adres?: string;
  ilce?: string;
  sehir?: string;
  postaKodu?: string;
}

/* ─── Ortak kabuk ─── */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
    {/* PayTR'a TLS el sıkışması iframe istenmeden başlasın (React bunları
        <head>'e taşır) — form birkaç yüz ms daha erken görünür. */}
    <link rel="preconnect" href="https://www.paytr.com" />
    <link rel="dns-prefetch" href="https://www.paytr.com" />
    <div
      style={{
        background: "var(--hl-bg)",
        minHeight: "100vh",
        color: "var(--hl-text)",
        fontFamily: "var(--hl-font-ui)",
      }}
    >
      <header
        style={{
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--hl-line)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <HalfLeafLogo width={13} height={22} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)" }}>Half Leaf</span>
        </Link>
        <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--hl-text-soft)", fontSize: 11 }}>
          <Lock size={12} /> Güvenli Ödeme
        </span>
      </header>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 64px" }}>{children}</main>
    </div>
    </>
  );
}

export default async function PaytrPaymentPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t } = await searchParams;

  /* Sipariş sorgusu ile hız sınırı kontrolü BİRBİRİNE BAĞLI DEĞİL; ardışık
     yapıldığında ödeme formunun açılmasına gereksiz bir gidiş-dönüş ekliyordu.
     Paralel çalıştırılıyor. */
  const hdrs = await headers();
  const userIp = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "";

  const [order, rl] = await Promise.all([
    prisma.order.findUnique({
      where: { orderNumber },
      include: {
        User: { select: { email: true } },
        OrderItem: { select: { productName: true, unitPrice: true, quantity: true } },
        Payment: {
          where: { provider: "paytr" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    // Kötüye kullanım koruması: aynı IP'den aşırı token isteğini sınırla.
    rateLimiter.checkLimit(`paytr-token:${normalizeUserIp(userIp)}`, {
      maxRequests: 20,
      windowMs: 10 * 60_000,
    }),
  ]);

  if (!order) notFound();

  // Ödeme sayfası müşterinin adını, adresini, telefonunu ve sepet içeriğini
  // gösterir; sipariş numarasını bilen herkese açık olamaz.
  if (!(await canViewOrder(order, t))) notFound();

  const tokenQuery = t ? `&t=${encodeURIComponent(t)}` : "";

  const payment = order.Payment[0];

  // Kart ödemesi olmayan / PayTR kaydı bulunmayan sipariş → 404.
  if (!payment) notFound();

  // Zaten ödenmiş → onay sayfasına.
  if (payment.status === "ODENDI") {
    redirect(`/siparis-tamamlandi?no=${encodeURIComponent(orderNumber)}${tokenQuery}`);
  }

  // İptal / başarısız → hata sayfasına.
  if (payment.status === "BASARISIZ" || order.status === "IPTAL_EDILDI") {
    redirect(`/odeme/hata?no=${encodeURIComponent(orderNumber)}${tokenQuery}`);
  }

  /* ── Ödeme parametrelerini hazırla ── */
  const addr = (order.shippingAddress ?? {}) as ShippingAddressShape;
  const basket: BasketLine[] = order.OrderItem.map((i) => ({
    name: i.productName,
    unitPrice: Number(i.unitPrice),
    quantity: i.quantity,
  }));
  const shippingTRY = Number(order.shippingTotal);
  if (shippingTRY > 0) {
    basket.push({ name: "Kargo", unitPrice: shippingTRY, quantity: 1 });
  }

  const base = getSiteBaseUrl();

  if (!rl.allowed) {
    return (
      <Shell>
        <div
          style={{
            background: "var(--hl-bg-elev-1)",
            border: "1px solid var(--hl-line)",
            borderRadius: 14,
            padding: 28,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: 24, fontWeight: 400, margin: "0 0 10px" }}>
            Çok fazla deneme
          </h1>
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7 }}>
            Kısa sürede çok fazla ödeme denemesi yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.
          </p>
        </div>
      </Shell>
    );
  }

  let token: string | null = null;
  let errorMessage: string | null = null;

  try {
    token = await getOrCreateIframeToken(order.orderNumber, {
      amountTRY: Number(order.grandTotal),
      email: order.User.email,
      userIp,
      userName: addr.fullName ?? "",
      userAddress: [addr.adres, addr.ilce, addr.sehir].filter(Boolean).join(" "),
      userPhone: addr.phone ?? "",
      basket,
      /* PayTR bu adresleri IFRAME'İN İÇİNDE açar. Sonuç sayfalarının kendisi
         `X-Frame-Options: DENY` ile korunduğundan doğrudan verilemez (beyaz
         ekran); araya çerçevelenebilen tek adres olan /odeme/donus köprüsü
         giriyor ve üst pencereyi gerçek sonuç sayfasına taşıyor. */
      okUrl: `${base}/odeme/donus?d=ok&no=${encodeURIComponent(order.orderNumber)}${tokenQuery}`,
      failUrl: `${base}/odeme/donus?d=fail&no=${encodeURIComponent(order.orderNumber)}${tokenQuery}`,
      lang: "tr",
    });
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Ödeme başlatılamadı. Lütfen tekrar deneyin.";
  }

  /* ── Hata durumu ── */
  if (!token) {
    return (
      <Shell>
        <div
          style={{
            background: "var(--hl-bg-elev-1)",
            border: "1px solid rgba(224,82,82,0.3)",
            borderRadius: 14,
            padding: 28,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <AlertTriangle size={36} color="#e05252" />
          <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: 26, fontWeight: 400, margin: 0 }}>
            Ödeme başlatılamadı
          </h1>
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, maxWidth: 420 }}>
            Güvenli ödeme formu şu anda açılamadı. Tutar hesabınızdan çekilmedi. Lütfen birkaç
            dakika sonra tekrar deneyin veya bizimle iletişime geçin.
          </p>
          <p style={{ fontSize: 11, color: "var(--hl-text-faint)" }}>
            Sipariş No: <strong style={{ color: "var(--hl-text-soft)" }}>{order.orderNumber}</strong>
            {errorMessage ? ` · ${errorMessage}` : ""}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
            <Link
              href={`/odeme/paytr/${encodeURIComponent(order.orderNumber)}${t ? `?t=${encodeURIComponent(t)}` : ""}`}
              style={{
                padding: "12px 28px",
                borderRadius: "var(--hl-r-pill)",
                background: "var(--hl-bronze-400)",
                color: "var(--hl-on-bronze)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Tekrar Dene
            </Link>
            <Link
              href="/iletisim"
              style={{
                padding: "12px 28px",
                borderRadius: "var(--hl-r-pill)",
                border: "1.5px solid var(--hl-line-strong)",
                color: "var(--hl-text-soft)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              İletişim
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Ödeme formu ── */
  return (
    <Shell>
      {/* Sipariş özeti şeridi */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          borderRadius: 12,
          background: "var(--hl-bg-elev-1)",
          border: "1px solid var(--hl-line)",
          marginBottom: 18,
        }}
      >
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 3 }}>
            Sipariş No
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-text)" }}>{order.orderNumber}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 3 }}>
            Ödenecek Tutar
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--hl-bronze-400)", lineHeight: 1 }}>
            {formatPrice(Number(order.grandTotal))}
          </p>
        </div>
      </div>

      {/* PayTR iframe */}
      <div
        style={{
          background: "var(--hl-bg-elev-1)",
          border: "1px solid var(--hl-line)",
          borderRadius: 14,
          padding: 8,
          overflow: "hidden",
        }}
      >
        <PaytrFrame iframeSrc={iframeUrl(token)} />
      </div>

      {/* Güven satırı + PayTR logosu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginTop: 16,
          color: "var(--hl-text-mute)",
          fontSize: 11,
        }}
      >
        <ShieldCheck size={13} color="var(--hl-bronze-400)" />
        <span>256-bit SSL ile şifrelenir · 3D Secure</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <PayTrLogo />
        <CardSchemes height={18} />
      </div>

      <p style={{ textAlign: "center", marginTop: 14, fontSize: 11 }}>
        <Link href="/sepet" style={{ color: "var(--hl-text-faint)", textDecoration: "none" }}>
          ← Vazgeç ve sepete dön
        </Link>
      </p>
    </Shell>
  );
}
