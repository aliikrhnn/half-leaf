/**
 * Admin — pazarlama kampanyası gönderimi.
 * GET: izinli kitle sayısı + e-posta yapılandırma durumu.
 * POST: kampanyayı izinli (marketingOptIn) kullanıcılara Resend batch ile gönderir.
 * Her e-posta kullanıcıya özel abonelik iptali (unsubscribe) linki içerir.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";
import { unsubscribeUrl, newUnsubscribeToken } from "@/lib/email/marketing";
import { campaignEmail, type MarketingProduct } from "@/lib/email/marketing-templates";
import { sendBatchEmails, sendEmail, isEmailConfigured } from "@/lib/email/resend";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";
const MAX_RECIPIENTS = 2000;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;
  try {
    const audience = await prisma.user.count({
      where: { marketingOptIn: true, isActive: true },
    });
    return ok({ audience, emailConfigured: isEmailConfigured() });
  } catch {
    return serverError();
  }
}

const BodySchema = z.object({
  subject: z.string().trim().min(3).max(150),
  preheader: z.string().trim().max(160).optional().default(""),
  headline: z.string().trim().min(3).max(120),
  intro: z.string().trim().min(5).max(2000),
  ctaLabel: z.string().trim().min(2).max(40).default("Koleksiyonu Keşfet"),
  ctaUrl: z.string().trim().url().optional(),
  discountCode: z.string().trim().max(40).optional(),
  discountNote: z.string().trim().max(120).optional(),
  productSlugs: z.array(z.string()).max(4).optional(),
  testEmail: z.string().trim().email().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  if (!isEmailConfigured()) {
    return badRequest("E-posta yapılandırması eksik (RESEND_API_KEY / EMAIL_FROM). Vercel ortam değişkenlerini ekleyin.");
  }

  let raw: unknown;
  try { raw = await req.json(); } catch { return badRequest("Geçersiz istek."); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz alanlar.");
  const d = parsed.data;

  try {
    // Öne çıkan ürünler (opsiyonel)
    let products: MarketingProduct[] = [];
    if (d.productSlugs && d.productSlugs.length > 0) {
      const usdTryRate = await getUsdTryRate();
      const rows = await prisma.product.findMany({
        where: { slug: { in: d.productSlugs }, isActive: true },
        select: {
          slug: true, name: true, basePrice: true, priceCurrency: true,
          ProductImage: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      });
      products = rows.map((p) => ({
        name: p.name,
        price: toTRY(Number(p.basePrice), (p.priceCurrency ?? "TRY") as PriceCurrency, usdTryRate),
        imageUrl: p.ProductImage[0]?.url ? absUrl(p.ProductImage[0].url) : null,
        url: `${SITE_URL}/urunler/${p.slug}`,
      }));
    }

    const ctaUrlEarly = d.ctaUrl || `${SITE_URL}/urunler`;

    // Test gönderimi: yalnızca verilen adrese tek e-posta (önizleme).
    if (d.testEmail) {
      const { html } = campaignEmail({
        preheader: d.preheader || d.headline,
        headline: d.headline,
        intro: d.intro,
        ctaLabel: d.ctaLabel,
        ctaUrl: ctaUrlEarly,
        discountCode: d.discountCode || null,
        discountNote: d.discountNote || null,
        products,
        unsubscribeUrl: `${SITE_URL}/abonelik-iptal?token=test`,
      });
      const okSent = await sendEmail({ to: d.testEmail, subject: `[TEST] ${d.subject}`, html });
      return ok({ sent: okSent ? 1 : 0, total: 1, test: true });
    }

    // İzinli kitle
    const recipients = await prisma.user.findMany({
      where: { marketingOptIn: true, isActive: true },
      select: { id: true, email: true, unsubscribeToken: true },
      take: MAX_RECIPIENTS,
    });

    if (recipients.length === 0) {
      return ok({ sent: 0, total: 0, note: "İzinli (marketingOptIn) kullanıcı yok." });
    }

    // Token'ı olmayanlara üret
    const emails = await Promise.all(
      recipients.map(async (u) => {
        let token = u.unsubscribeToken;
        if (!token) {
          token = newUnsubscribeToken();
          await prisma.user.update({ where: { id: u.id }, data: { unsubscribeToken: token } });
        }
        const { html } = campaignEmail({
          preheader: d.preheader || d.headline,
          headline: d.headline,
          intro: d.intro,
          ctaLabel: d.ctaLabel,
          ctaUrl: ctaUrlEarly,
          discountCode: d.discountCode || null,
          discountNote: d.discountNote || null,
          products,
          unsubscribeUrl: unsubscribeUrl(token),
        });
        return { to: u.email, subject: d.subject, html };
      }),
    );

    const sent = await sendBatchEmails(emails);

    // Denetim kaydı
    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action: "CAMPAIGN_SENT",
        entityType: "Campaign",
        entityId: d.subject.slice(0, 60),
        changes: JSON.parse(JSON.stringify({ subject: d.subject, total: emails.length, sent })),
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return ok({ sent, total: emails.length });
  } catch {
    return serverError();
  }
}

/** Göreli görsel yolunu mutlak yap (e-posta istemcileri mutlak URL ister). */
function absUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
