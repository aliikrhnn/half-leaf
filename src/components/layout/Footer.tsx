import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { SITE_NAME, FOOTER_LINKS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

async function getSiteSettings() {
  try {
    return await prisma.siteSettings.findUnique({
      where:  { id: "site" },
      select: { contactEmail: true, contactPhone: true, instagramUrl: true, facebookUrl: true },
    });
  } catch {
    return null;
  }
}

export default async function Footer() {
  const s = await getSiteSettings();

  const contactPhone   = s?.contactPhone   ?? "+90 212 000 00 00";
  const contactEmail   = s?.contactEmail   ?? "info@halfleafstore.com";
  const instagramUrl   = s?.instagramUrl   ?? "https://instagram.com/halfleafstore";
  const facebookUrl    = s?.facebookUrl    ?? "https://facebook.com/halfleafstore";

  return (
    <footer
      style={{
        background: "var(--hl-bg-elev-1)",
        borderTop: "1px solid var(--hl-line)",
      }}
    >
      <div
        className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
        style={{ paddingTop: 24, paddingBottom: 16 }}
      >
        {/* Main grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-6 lg:gap-8"
          style={{ marginBottom: 14 }}
        >
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <div style={{ marginBottom: 8 }}>
              <span className="hl-logo-hover">
                <HalfLeafLogo full width={70} height={58} />
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--hl-font-ui)",
                fontSize: 12,
                color: "var(--hl-text-mute)",
                lineHeight: 1.5,
                maxWidth: 200,
                marginBottom: 10,
              }}
            >
              Modern nargile ekipmanları için seçilmiş premium koleksiyon.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-[var(--hl-bronze-400)] transition-colors"
                style={{ color: "var(--hl-text-mute)" }}
              >
                <Instagram size={15} />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-[var(--hl-bronze-400)] transition-colors"
                style={{ color: "var(--hl-text-mute)" }}
              >
                <Facebook size={15} />
              </a>
            </div>
            <div
              style={{
                fontFamily: "var(--hl-font-ui)",
                fontSize: 11,
                color: "var(--hl-text-faint)",
                lineHeight: 1.7,
              }}
            >
              <a
                href={`tel:${contactPhone}`}
                className="hover:text-[var(--hl-text-mute)] transition-colors"
                style={{ color: "var(--hl-text-faint)", textDecoration: "none", display: "block" }}
              >
                {contactPhone}
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="hover:text-[var(--hl-text-mute)] transition-colors"
                style={{ color: "var(--hl-text-faint)", textDecoration: "none", display: "block" }}
              >
                {contactEmail}
              </a>
            </div>
          </div>

          {/* Link columns */}
          {(
            [
              { title: "Kurumsal", links: FOOTER_LINKS.kurumsallar },
              { title: "Yardım", links: FOOTER_LINKS.yardim },
              { title: "Yasal", links: FOOTER_LINKS.yasal },
            ] as const
          ).map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  fontFamily: "var(--hl-font-ui)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  color: "var(--hl-bronze-400)",
                  marginBottom: 8,
                }}
              >
                {col.title}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.href} style={{ marginBottom: 5 }}>
                    <Link
                      href={link.href}
                      className="hover:text-[var(--hl-text)] transition-colors"
                      style={{
                        fontFamily: "var(--hl-font-ui)",
                        fontSize: 12,
                        color: "var(--hl-text-mute)",
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment trust strip */}
        <div
          style={{
            paddingTop: 14,
            paddingBottom: 12,
            borderTop: "1px solid var(--hl-line)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              fontFamily: "var(--hl-font-ui)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--hl-bronze-400)",
            }}
          >
            Güvenli Ödeme
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 10px",
              borderRadius: 7,
              background: "var(--hl-bg)",
              border: "1px solid var(--hl-line-strong)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/payment/paytr-logo-white.svg" alt="PayTR ile güvenli ödeme" height={15} style={{ height: 15, width: "auto" }} />
          </span>
          <span
            style={{
              fontFamily: "var(--hl-font-ui)",
              fontSize: 11,
              color: "var(--hl-text-mute)",
            }}
          >
            256-bit SSL · 3D Secure · Kredi / Banka Kartı · Havale / EFT
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: 12,
            borderTop: "1px solid var(--hl-line)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <p
            style={{
              fontFamily: "var(--hl-font-ui)",
              fontSize: 11,
              color: "var(--hl-text-faint)",
            }}
          >
            © {new Date().getFullYear()} {SITE_NAME}. Tüm hakları saklıdır.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--hl-font-ui)",
                fontSize: 10,
                color: "var(--hl-text-faint)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--hl-success)",
                  flexShrink: 0,
                }}
              />
              SSL Güvenli Alışveriş
            </span>
            <span
              style={{
                fontFamily: "var(--hl-font-ui)",
                fontSize: 10,
                color: "var(--hl-text-faint)",
                border: "1px solid var(--hl-line-strong)",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              +18
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
