import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { RotateCcw, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "İade Taleplerim",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  TALEP_OLUSTURULDU: "Talep Edildi",
  INCELENIYOR:       "İnceleniyor",
  ONAYLANDI:         "Onaylandı",
  REDDEDILDI:        "Reddedildi",
  TAMAMLANDI:        "Tamamlandı",
};

const STATUS_COLOR: Record<string, string> = {
  TALEP_OLUSTURULDU: "var(--hl-text-mute)",
  INCELENIYOR:       "#e0a840",
  ONAYLANDI:         "#7ab87a",
  REDDEDILDI:        "#e05252",
  TAMAMLANDI:        "var(--hl-bronze-400)",
};

const TYPE_LABEL: Record<string, string> = {
  IADE:    "İade",
  DEGISIM: "Değişim",
};

function formatDate(iso: string | Date) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function IadeTaleplerimPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hl-token")?.value;
  if (!token) redirect("/giris?redirect=/hesabim/iade-taleplerim");

  let userId = "";
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    redirect("/giris?redirect=/hesabim/iade-taleplerim");
  }

  const requests = await prisma.returnRequest.findMany({
    where:   { userId },
    select: {
      id:        true,
      status:    true,
      type:      true,
      createdAt: true,
      updatedAt: true,
      Order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const panelStyle: React.CSSProperties = {
    background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
    borderRadius: 14, padding: 24,
  };

  return (
    <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 12px)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <Link href="/hesabim" style={{
            fontSize: 11, color: "var(--hl-text-mute)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12,
          }}>
            ← Hesabım
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RotateCcw size={18} style={{ color: "var(--hl-bronze-400)" }} />
            <h1 style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)", margin: 0,
            }}>
              İade Taleplerim
            </h1>
          </div>
        </div>

        <div style={panelStyle}>
          {requests.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--hl-text-mute)", textAlign: "center", padding: "32px 0" }}>
              Henüz iade talebiniz bulunmuyor.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {requests.map((rr) => (
                <Link
                  key={rr.id}
                  href={`/hesabim/iade-taleplerim/${rr.id}`}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", borderRadius: 10,
                    background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)",
                    textDecoration: "none", flexWrap: "wrap", gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-text)" }}>
                        #{rr.Order.orderNumber}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                        textTransform: "uppercase", padding: "2px 7px", borderRadius: 99,
                        background: "var(--hl-bg-elev-2)",
                        color: STATUS_COLOR[rr.status] ?? "var(--hl-text-mute)",
                      }}>
                        {STATUS_LABEL[rr.status] ?? rr.status}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                        textTransform: "uppercase", color: "var(--hl-text-mute)",
                        padding: "2px 7px", borderRadius: 99,
                        border: "1px solid var(--hl-line-strong)",
                      }}>
                        {TYPE_LABEL[rr.type] ?? rr.type}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--hl-text-mute)", margin: 0 }}>
                      Talep: {formatDate(rr.createdAt)} · Güncelleme: {formatDate(rr.updatedAt)}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--hl-text-mute)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
