import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

export const metadata: Metadata = {
  title: "Abonelik İptali",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AbonelikIptalPage({ searchParams }: Props) {
  const { token } = await searchParams;

  let success = false;
  if (token) {
    try {
      const user = await prisma.user.findFirst({
        where: { unsubscribeToken: token },
        select: { id: true },
      });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { marketingOptIn: false } });
        success = true;
      }
    } catch {
      success = false;
    }
  }

  return (
    <div style={{ background: "var(--hl-bg)", minHeight: "100vh", color: "var(--hl-text)", fontFamily: "var(--hl-font-ui)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "18px 24px", borderBottom: "1px solid var(--hl-line)", display: "flex", justifyContent: "center" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <HalfLeafLogo width={14} height={24} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)" }}>Half Leaf</span>
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px", display: "grid", placeItems: "center",
            background: success ? "rgba(122,184,122,0.12)" : "rgba(224,82,82,0.1)",
            border: success ? "1px solid rgba(122,184,122,0.3)" : "1px solid rgba(224,82,82,0.3)" }}>
            {success ? <CheckCircle size={32} color="#7ab87a" /> : <AlertTriangle size={32} color="#e05252" />}
          </div>
          <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: 30, fontWeight: 400, fontStyle: "italic", margin: "0 0 12px" }}>
            {success ? "Aboneliğiniz iptal edildi" : "Bağlantı geçersiz"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 24 }}>
            {success
              ? "Artık kampanya ve fırsat e-postaları almayacaksınız. Sipariş ve kargo bilgilendirmeleri (işlem e-postaları) gönderilmeye devam eder."
              : "Abonelik iptali bağlantısı geçersiz veya süresi dolmuş olabilir. Bir sorun yaşıyorsanız bizimle iletişime geçin."}
          </p>
          <Link href="/" style={{ display: "inline-block", padding: "12px 30px", borderRadius: "var(--hl-r-pill)", background: "var(--hl-bronze-400)", color: "#0A0B09", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    </div>
  );
}
