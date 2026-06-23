/**
 * E-posta HTML şablonları. Basit, e-posta-istemcisi-uyumlu (inline stil, tablo
 * yerine güvenli blok yapısı), Half Leaf bronz aksanlı açık tema.
 */

import { formatPrice } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";
const BRONZE = "#9a7a44";
const INK = "#1a1c16";
const MUTE = "#6b6758";

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f2ec;font-family:Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:8px 0 20px;">
      <span style="font-size:13px;letter-spacing:4px;text-transform:uppercase;color:${BRONZE};font-weight:700;">HALF LEAF</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6e2d8;border-radius:14px;padding:28px 24px;">
      <h1 style="font-size:21px;margin:0 0 14px;color:${INK};">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;font-size:11px;color:${MUTE};margin:18px 0 0;">© ${new Date().getFullYear()} Half Leaf · halfleafstore.com<br>Yalnızca 18 yaş ve üzeri için.</p>
  </div>
</body></html>`;
}

function itemsTable(items: ReadonlyArray<{ name: string; quantity: number; lineTotal: number }>): string {
  const rows = items
    .map(
      (i) =>
        `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0ede5;">
          <span style="font-size:14px;color:${INK};">${escapeHtml(i.name)} <span style="color:${MUTE};">× ${i.quantity}</span></span>
          <span style="font-size:14px;font-weight:700;color:${BRONZE};white-space:nowrap;">${formatPrice(i.lineTotal)}</span>
        </div>`,
    )
    .join("");
  return rows;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRONZE};color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 26px;border-radius:999px;">${label}</a>`;
}

export interface OrderEmailData {
  orderNumber: string;
  items: ReadonlyArray<{ name: string; quantity: number; lineTotal: number }>;
  grandTotal: number;
  paymentMethod?: "KREDI_KARTI" | "HAVALE_EFT" | string;
}

/** Sipariş onay e-postası. */
export function orderConfirmationEmail(data: OrderEmailData): { subject: string; html: string } {
  const trackUrl = `${SITE_URL}/siparis-takip?no=${encodeURIComponent(data.orderNumber)}`;
  const havaleNote =
    data.paymentMethod === "HAVALE_EFT"
      ? `<div style="background:#faf7f0;border:1px solid #e8e1d2;border-radius:10px;padding:12px 14px;margin:16px 0;font-size:13px;color:${MUTE};">Havale/EFT ödemeniz hesabımıza ulaştığında siparişiniz onaylanır. Açıklamaya <b style="color:${INK};">${escapeHtml(data.orderNumber)}</b> sipariş numaranızı yazmayı unutmayın.</div>`
      : "";

  const body = `
    <p style="font-size:14px;color:${MUTE};line-height:1.7;margin:0 0 16px;">Siparişiniz başarıyla alındı. Aşağıda sipariş özetinizi bulabilirsiniz.</p>
    <div style="background:#faf8f3;border:1px solid #ece7db;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
      <span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTE};">Sipariş No</span><br>
      <span style="font-size:17px;font-weight:700;color:${INK};">${escapeHtml(data.orderNumber)}</span>
    </div>
    ${itemsTable(data.items)}
    <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:6px;border-top:2px solid #ece7db;">
      <span style="font-size:15px;font-weight:700;color:${INK};">Toplam</span>
      <span style="font-size:18px;font-weight:800;color:${BRONZE};">${formatPrice(data.grandTotal)}</span>
    </div>
    ${havaleNote}
    <div style="text-align:center;margin-top:22px;">${button(trackUrl, "Siparişini Takip Et")}</div>
  `;
  return { subject: `Siparişiniz alındı · ${data.orderNumber}`, html: shell("Teşekkürler! Siparişiniz alındı", body) };
}

export interface AbandonedCartEmailData {
  firstName?: string | null;
  items: ReadonlyArray<{ name: string; quantity: number; lineTotal: number; image?: string | null }>;
  total: number;
}

/** Terk edilen sepet hatırlatma e-postası — reklam diliyle, "fırsatı kaçırma" tonu. */
export function abandonedCartEmail(data: AbandonedCartEmailData): { subject: string; html: string } {
  const cartUrl = `${SITE_URL}/sepet`;
  const hi = data.firstName?.trim() ? `${escapeHtml(data.firstName.trim())}, ` : "";

  const rows = data.items
    .map((i) => {
      const thumb = i.image
        ? `<td width="56" style="padding:0 12px 0 0;vertical-align:middle;">
             <img src="${escapeHtml(i.image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid #ece7db;">
           </td>`
        : "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f0ede5;">
        <tr>
          ${thumb}
          <td style="padding:10px 0;vertical-align:middle;font-size:14px;color:${INK};">
            ${escapeHtml(i.name)} <span style="color:${MUTE};">× ${i.quantity}</span>
          </td>
          <td style="padding:10px 0;vertical-align:middle;text-align:right;font-size:14px;font-weight:700;color:${BRONZE};white-space:nowrap;">${formatPrice(i.lineTotal)}</td>
        </tr>
      </table>`;
    })
    .join("");

  const body = `
    <p style="font-size:15px;color:${INK};line-height:1.7;margin:0 0 6px;">${hi}sepetinde harika ürünler bıraktın 🌿</p>
    <p style="font-size:14px;color:${MUTE};line-height:1.7;margin:0 0 18px;">Seçtiklerin hâlâ seni bekliyor — ama stoklar hızla eriyor. Siparişini tamamlamak yalnızca birkaç saniye sürer.</p>
    ${rows}
    <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:6px;border-top:2px solid #ece7db;">
      <span style="font-size:15px;font-weight:700;color:${INK};">Sepet Toplamı</span>
      <span style="font-size:18px;font-weight:800;color:${BRONZE};">${formatPrice(data.total)}</span>
    </div>
    <div style="text-align:center;margin-top:24px;">${button(cartUrl, "Sepetime Geri Dön")}</div>
    <p style="text-align:center;font-size:12px;color:${MUTE};margin:16px 0 0;line-height:1.6;">Ücretsiz kargo ve güvenli ödeme · Aklında soru varsa WhatsApp&apos;tan bize yazabilirsin.</p>
  `;
  return {
    subject: "Sepetinde unuttuğun ürünler var 🌿 — fırsatı kaçırma",
    html: shell("Sepetin seni bekliyor", body),
  };
}

export interface ShippingEmailData {
  orderNumber: string;
  provider: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

/** Kargo bildirimi e-postası. */
export function shippingNotificationEmail(data: ShippingEmailData): { subject: string; html: string } {
  const trackUrl = `${SITE_URL}/siparis-takip?no=${encodeURIComponent(data.orderNumber)}`;
  const trackingLine = data.trackingNumber
    ? `<p style="font-size:14px;color:${INK};margin:8px 0;">Takip No: <b>${escapeHtml(data.trackingNumber)}</b></p>`
    : "";
  const carrierLink = data.trackingUrl
    ? `<p style="margin:8px 0;"><a href="${escapeHtml(data.trackingUrl)}" style="color:${BRONZE};">Kargo firması takip sayfası →</a></p>`
    : "";

  const body = `
    <p style="font-size:14px;color:${MUTE};line-height:1.7;margin:0 0 16px;"><b style="color:${INK};">${escapeHtml(data.orderNumber)}</b> numaralı siparişiniz <b style="color:${INK};">${escapeHtml(data.provider)}</b> ile kargoya verildi.</p>
    ${trackingLine}
    ${carrierLink}
    <div style="text-align:center;margin-top:22px;">${button(trackUrl, "Siparişini Takip Et")}</div>
  `;
  return { subject: `Siparişiniz kargoda · ${data.orderNumber}`, html: shell("Siparişiniz yola çıktı 🚚", body) };
}
