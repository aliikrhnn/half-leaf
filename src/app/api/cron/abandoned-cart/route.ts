/**
 * Terk edilen sepet hatırlatma cron'u.
 *
 * Giriş yapmış kullanıcıların ürün bırakıp ayrıldığı AKTIF sepetleri tespit eder
 * ve "sepetinde ürünler var, fırsatı kaçırma" tonunda tek bir hatırlatma
 * e-postası gönderir. Tekrar göndermeyi önlemek için reminderSentAt işaretlenir;
 * kullanıcı sepetini değiştirdiğinde (CartSync) bu alan sıfırlanır.
 *
 * Pencere: son etkinlikten >= 1 saat (acele etmeyelim) ve <= 7 gün (çok eski
 * sepetlere reklam atmayalım) önce güncellenmiş, henüz hatırlatma gönderilmemiş,
 * ürünü olan sepetler.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email/resend";
import { abandonedCartEmail } from "@/lib/email/templates";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WAIT_MINUTES = 60;      // en az 1 saat bekle
const MAX_AGE_DAYS = 7;       // 7 günden eski sepetlere gönderme
const BATCH = 100;            // tur başına en fazla sepet

/** E-posta <img src> için yalnızca http(s) şemasına izin ver (data:/javascript: vb. engelle). */
function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: "E-posta yapılandırılmamış." });
  }

  const now = Date.now();
  const recentCutoff = new Date(now - WAIT_MINUTES * 60_000);
  const oldCutoff = new Date(now - MAX_AGE_DAYS * 86_400_000);

  const carts = await prisma.cart.findMany({
    where: {
      status: "AKTIF",
      reminderSentAt: null,
      userId: { not: null },
      updatedAt: { lt: recentCutoff, gt: oldCutoff },
      CartItem: { some: {} },
    },
    orderBy: { updatedAt: "asc" },
    take: BATCH,
    select: {
      id: true,
      User: { select: { email: true, fullName: true } },
      CartItem: {
        select: {
          quantity: true,
          Product: {
            select: {
              name: true,
              basePrice: true,
              priceCurrency: true,
              ProductImage: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  if (carts.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  const rate = await getUsdTryRate();

  let sent = 0;
  let skipped = 0;

  for (const cart of carts) {
    const email = cart.User?.email;
    if (!email || cart.CartItem.length === 0) {
      // E-postası olmayan / ürünü kalmayan sepeti tekrar denememek için işaretle.
      await prisma.cart.update({ where: { id: cart.id }, data: { reminderSentAt: new Date() } }).catch(() => {});
      skipped++;
      continue;
    }

    const items = cart.CartItem.map((ci) => {
      const unit = toTRY(Number(ci.Product.basePrice), ci.Product.priceCurrency as PriceCurrency, rate);
      return {
        name: ci.Product.name,
        quantity: ci.quantity,
        lineTotal: unit * ci.quantity,
        image: safeImageUrl(ci.Product.ProductImage[0]?.url),
      };
    });
    const total = items.reduce((s, i) => s + i.lineTotal, 0);
    const firstName = cart.User?.fullName?.trim().split(/\s+/)[0] ?? null;

    const mail = abandonedCartEmail({ firstName, items, total });
    const okSent = await sendEmail({ to: email, subject: mail.subject, html: mail.html });

    if (okSent) {
      // Yalnızca BAŞARILI gönderimde işaretle; geçici e-posta hatasında işaretleme
      // → bir sonraki tur (MAX_AGE_DAYS penceresi içinde) tekrar dener.
      await prisma.cart.update({ where: { id: cart.id }, data: { reminderSentAt: new Date() } }).catch(() => {});
      sent++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ checked: carts.length, sent, skipped });
}
