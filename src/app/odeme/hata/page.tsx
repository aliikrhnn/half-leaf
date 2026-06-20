import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

export const metadata: Metadata = {
  title: "Ödeme Tamamlanamadı",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ no?: string }>;
}

export default async function OdemeHataPage({ searchParams }: Props) {
  const { no } = await searchParams;

  // Sipariş hâlâ ödeme bekliyor olabilir (callback gecikmiş) → tekrar denemeye izin ver.
  const order = no
    ? await prisma.order.findUnique({
        where: { orderNumber: no },
        select: {
          orderNumber: true,
          status: true,
          Payment: {
            where: { provider: "paytr" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, failureReason: true },
          },
        },
      })
    : null;

  const payment = order?.Payment[0];
  // Ödeme hâlâ bekliyorsa kullanıcı aynı sipariş üzerinden tekrar deneyebilir.
  const canRetry = Boolean(order) && payment?.status === "BEKLIYOR";

  return (
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
          padding: "18px 56px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--hl-line)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <HalfLeafLogo width={14} height={24} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)" }}>Half Leaf</span>
        </Link>
        <span style={{ fontSize: 11, color: "var(--hl-text-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Ödeme
        </span>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px 80px", textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(224,82,82,0.1)",
            border: "1px solid rgba(224,82,82,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <XCircle size={36} color="#e05252" />
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 12 }}>
          İşlem Tamamlanamadı
        </p>

        <h1
          style={{
            fontFamily: "var(--hl-font-display)",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--hl-text)",
            lineHeight: 1.1,
            margin: "0 0 16px 0",
          }}
        >
          Ödeme tamamlanamadı
        </h1>

        <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 28 }}>
          Ödeme işleminiz tamamlanamadı ve <strong style={{ color: "var(--hl-text-soft)" }}>tutar hesabınızdan çekilmedi</strong>.
          Sepetinizdeki ürünler korundu; dilerseniz ödemeyi tekrar deneyebilirsiniz.
        </p>

        {order && (
          <div
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 10,
              background: "var(--hl-bg-elev-1)",
              border: "1px solid var(--hl-line)",
              marginBottom: 32,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--hl-text-mute)" }}>Sipariş No: </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)" }}>{order.orderNumber}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {canRetry ? (
            <Link
              href={`/odeme/paytr/${encodeURIComponent(order!.orderNumber)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 30px",
                borderRadius: "var(--hl-r-pill)",
                background: "var(--hl-bronze-400)",
                color: "#0A0B09",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              <RefreshCw size={14} /> Ödemeyi Tekrar Dene
            </Link>
          ) : (
            <Link
              href="/sepet"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 30px",
                borderRadius: "var(--hl-r-pill)",
                background: "var(--hl-bronze-400)",
                color: "#0A0B09",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              <ShoppingBag size={14} /> Sepete Dön
            </Link>
          )}
          <Link
            href="/urunler"
            style={{
              padding: "13px 30px",
              borderRadius: "var(--hl-r-pill)",
              border: "1.5px solid var(--hl-line-strong)",
              background: "none",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--hl-text-soft)",
            }}
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--hl-line)",
          padding: "16px 56px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--hl-text-mute)",
        }}
      >
        <span>© {new Date().getFullYear()} Half Leaf</span>
        <Link href="/iletisim" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>
          İletişim
        </Link>
      </footer>
    </div>
  );
}
