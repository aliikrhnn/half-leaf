import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle, AlertTriangle, MailX } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter } from "@/lib/rate-limit/limiter";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

export const metadata: Metadata = {
  title: "Abonelik İptali",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string; done?: string }>;
}

/**
 * Abonelikten çıkarma İŞLEMİ.
 *
 * Önceden bu iş sayfanın GET render'ında yapılıyordu: e-posta istemcilerinin
 * bağlantı ön-taraması, tarayıcı prefetch'i veya bir önizleme botu linke
 * dokunduğunda kullanıcı istemeden listeden çıkarılıyordu. Artık yalnızca
 * kullanıcının açık onayıyla (POST) çalışır.
 */
async function unsubscribeAction(formData: FormData): Promise<void> {
  "use server";

  const token = String(formData.get("token") ?? "").trim();
  if (!token) redirect("/abonelik-iptal");

  const hdrs = await headers();
  const ip =
    hdrs.get("x-vercel-forwarded-for") ??
    hdrs.get("x-real-ip") ??
    hdrs.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";

  const limit = await rateLimiter.checkLimit(`unsubscribe:${ip}`, {
    maxRequests: 10,
    windowMs: 10 * 60_000,
  });
  if (!limit.allowed) redirect("/abonelik-iptal?done=0");

  let ok = false;
  try {
    const user = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true },
    });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { marketingOptIn: false } });
      ok = true;
    }
  } catch {
    ok = false;
  }

  redirect(`/abonelik-iptal?done=${ok ? "1" : "0"}`);
}

export default async function AbonelikIptalPage({ searchParams }: Props) {
  const { token, done } = await searchParams;

  const state: "confirm" | "success" | "invalid" =
    done === "1" ? "success" : done === "0" ? "invalid" : token ? "confirm" : "invalid";

  const heading =
    state === "success" ? "Aboneliğiniz iptal edildi"
    : state === "confirm" ? "E-posta aboneliğinizi iptal edin"
    : "Bağlantı geçersiz";

  const description =
    state === "success"
      ? "Artık kampanya ve fırsat e-postaları almayacaksınız. Sipariş ve kargo bilgilendirmeleri (işlem e-postaları) gönderilmeye devam eder."
      : state === "confirm"
      ? "Onayladığınızda kampanya ve fırsat e-postaları durur. Sipariş ve kargo bilgilendirmeleri gönderilmeye devam eder."
      : "Abonelik iptali bağlantısı geçersiz veya süresi dolmuş olabilir. Bir sorun yaşıyorsanız bizimle iletişime geçin.";

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
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px", display: "grid", placeItems: "center",
            background: state === "success" ? "rgba(122,184,122,0.12)" : state === "confirm" ? "rgba(201,160,106,0.12)" : "rgba(224,82,82,0.1)",
            border: state === "success" ? "1px solid rgba(122,184,122,0.3)" : state === "confirm" ? "1px solid var(--hl-line-bronze)" : "1px solid rgba(224,82,82,0.3)",
          }}>
            {state === "success" ? <CheckCircle size={32} color="var(--hl-success)" />
              : state === "confirm" ? <MailX size={32} color="var(--hl-bronze-400)" />
              : <AlertTriangle size={32} color="var(--hl-danger)" />}
          </div>

          <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: 30, fontWeight: 400, fontStyle: "normal", margin: "0 0 12px" }}>
            {heading}
          </h1>
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 24 }}>
            {description}
          </p>

          {state === "confirm" ? (
            <form action={unsubscribeAction} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  padding: "13px 30px", borderRadius: "var(--hl-r-pill)", border: "none",
                  background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
                  fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Aboneliği İptal Et
              </button>
              <Link href="/" style={{ fontSize: 12, color: "var(--hl-text-mute)", textDecoration: "none" }}>
                Vazgeç, e-posta almaya devam et
              </Link>
            </form>
          ) : (
            <Link href="/" style={{ display: "inline-block", padding: "12px 30px", borderRadius: "var(--hl-r-pill)", background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
              Ana Sayfaya Dön
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
