/**
 * Pazarlama (kampanya) e-posta şablonları — dönüşüm odaklı, mobil-uyumlu,
 * e-posta istemcisi güvenli (inline stil, tablo tabanlı düzen).
 * Her pazarlama e-postası YASAL olarak abonelik iptali (unsubscribe) linki içerir.
 */

import { formatPrice } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";
const BRONZE = "#9a7a44";
const BRONZE_DK = "#7a5f34";
const INK = "#1a1c16";
const MUTE = "#6b6758";
const BG = "#f4f2ec";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface MarketingProduct {
  name: string;
  price: number;
  imageUrl: string | null;
  url: string;
}

/** Ortak pazarlama kabuğu: marka başlığı + preheader + içerik + abonelik iptali footer. */
function marketingShell(opts: {
  preheader: string;
  contentHtml: string;
  unsubscribeUrl: string;
}): string {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BG};font-size:1px;line-height:1px;">${esc(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Brand header -->
        <tr><td align="center" style="padding:6px 0 18px;">
          <a href="${SITE_URL}" style="text-decoration:none;font-family:Georgia,serif;font-size:15px;letter-spacing:5px;text-transform:uppercase;color:${BRONZE};font-weight:bold;">HALF&nbsp;LEAF</a>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e6e2d8;border-radius:16px;overflow:hidden;">
          ${opts.contentHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="padding:20px 16px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${MUTE};line-height:1.7;">
          Half Leaf · <a href="${SITE_URL}" style="color:${MUTE};">halfleafstore.com</a> · Yalnızca 18 yaş ve üzeri için<br>
          Bu e-postayı, kampanya bildirimlerine onay verdiğiniz için aldınız.<br>
          <a href="${esc(opts.unsubscribeUrl)}" style="color:${MUTE};text-decoration:underline;">Abonelikten çık</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto;"><tr><td align="center" style="border-radius:999px;background:${BRONZE};">
    <a href="${esc(url)}" style="display:inline-block;padding:14px 34px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(label)}</a>
  </td></tr></table>`;
}

function productGrid(products: ReadonlyArray<MarketingProduct>): string {
  if (products.length === 0) return "";
  const cells = products
    .slice(0, 4)
    .map(
      (p) => `<td width="50%" valign="top" style="padding:8px;">
        <a href="${esc(p.url)}" style="text-decoration:none;color:${INK};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f3;border:1px solid #ece7db;border-radius:12px;overflow:hidden;">
            ${p.imageUrl ? `<tr><td><img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" width="100%" style="display:block;width:100%;max-width:260px;height:auto;border:0;"></td></tr>` : ""}
            <tr><td style="padding:10px 12px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:${INK};line-height:1.35;">${esc(p.name)}</div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:${BRONZE};margin-top:4px;">${formatPrice(p.price)}</div>
            </td></tr>
          </table>
        </a>
      </td>`,
    );
  // 2'li satırlar
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push(`<tr>${cells[i]}${cells[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:4px 12px;">${rows.join("")}</table>`;
}

export interface CampaignEmailData {
  preheader: string;
  headline: string;
  intro: string; // ana metin (düz; satır sonları <br>'ye çevrilir)
  ctaLabel: string;
  ctaUrl: string;
  discountCode?: string | null;
  discountNote?: string | null;
  products?: ReadonlyArray<MarketingProduct>;
  unsubscribeUrl: string;
}

/** Genel kampanya e-postası. */
export function campaignEmail(d: CampaignEmailData): { html: string } {
  const introHtml = esc(d.intro).replace(/\n/g, "<br>");
  const discountBlock = d.discountCode
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:6px 20px 14px;">
        <div style="display:inline-block;border:2px dashed ${BRONZE};border-radius:12px;padding:14px 26px;background:#faf7f0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTE};">İndirim Kodu</div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:bold;letter-spacing:3px;color:${BRONZE_DK};margin-top:4px;">${esc(d.discountCode)}</div>
          ${d.discountNote ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${MUTE};margin-top:6px;">${esc(d.discountNote)}</div>` : ""}
        </div>
      </td></tr></table>`
    : "";

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:30px 28px 8px;font-family:Georgia,serif;">
        <h1 style="margin:0;font-size:27px;line-height:1.25;color:${INK};font-style:italic;font-weight:normal;">${esc(d.headline)}</h1>
      </td></tr>
      <tr><td style="padding:10px 28px 4px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${MUTE};">${introHtml}</td></tr>
      ${discountBlock}
      <tr><td align="center" style="padding:6px 20px 18px;">${ctaButton(d.ctaLabel, d.ctaUrl)}</td></tr>
      ${productGrid(d.products ?? [])}
      <tr><td style="padding:14px 28px 30px;"></td></tr>
    </table>`;

  return { html: marketingShell({ preheader: d.preheader, contentHtml: content, unsubscribeUrl: d.unsubscribeUrl }) };
}

export interface WelcomeEmailData {
  name: string;
  discountCode?: string | null;
  unsubscribeUrl: string;
}

/** Yeni üye hoş geldin e-postası. */
export function welcomeEmail(d: WelcomeEmailData): { subject: string; html: string } {
  const discountBlock = d.discountCode
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:4px 20px 16px;">
        <div style="display:inline-block;border:2px dashed ${BRONZE};border-radius:12px;padding:14px 26px;background:#faf7f0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTE};">İlk Siparişine Özel</div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:bold;letter-spacing:3px;color:${BRONZE_DK};margin-top:4px;">${esc(d.discountCode)}</div>
        </div>
      </td></tr></table>`
    : "";

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:30px 28px 8px;font-family:Georgia,serif;">
        <h1 style="margin:0;font-size:27px;line-height:1.25;color:${INK};font-style:italic;font-weight:normal;">Aramıza hoş geldin${d.name ? ", " + esc(d.name) : ""}!</h1>
      </td></tr>
      <tr><td style="padding:10px 28px 4px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${MUTE};">
        Half Leaf ailesine katıldığın için teşekkürler. Özenle seçilmiş premium koleksiyonumuzu keşfetmeye hazır mısın?
      </td></tr>
      ${discountBlock}
      <tr><td align="center" style="padding:6px 20px 26px;">${ctaButton("Koleksiyonu Keşfet", `${SITE_URL}/urunler`)}</td></tr>
    </table>`;

  return {
    subject: "Half Leaf'e hoş geldin 🍃",
    html: marketingShell({ preheader: "Aramıza hoş geldin — koleksiyonu keşfet.", contentHtml: content, unsubscribeUrl: d.unsubscribeUrl }),
  };
}
