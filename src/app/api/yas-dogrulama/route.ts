/**
 * Yaş doğrulama (18+) beyanının sunucuya kaydı.
 *
 * Önceden beyan yalnızca `localStorage`'da tutuluyordu: sunucu tarafında hiçbir
 * izi yoktu, yani "kullanıcı beyan etti" iddiası kanıtlanamıyordu. Artık beyan
 * bir çerezle sunucuya taşınır ve ConsentLog'a IP + zaman damgasıyla yazılır.
 *
 * Not: Çerez bilinçli olarak httpOnly DEĞİLDİR — yaş kapısı örtüsünün
 * gösterilip gösterilmeyeceğine istemci karar verir. Sunucu tarafında zorlayıcı
 * yönlendirme uygulanmaz; uygulanırsa çerez göndermeyen arama motoru botları da
 * kapıya yönlenir ve ürün sayfaları indekslenemez hâle gelir.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";
import { getAuthUser } from "@/lib/auth/middleware";

export const runtime = "nodejs";

export const AGE_COOKIE = "hl-age";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`yas:${ip}`, { maxRequests: 20, windowMs: 60 * 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  const auth = await getAuthUser(req);

  try {
    await prisma.consentLog.create({
      data: {
        userId: auth?.userId ?? null,
        email: auth?.email ?? null,
        consentType: "YAS_DOGRULAMA",
        textVersion: "v1.0",
        granted: true,
        ipAddress: ip === "unknown" ? null : ip,
        userAgent: req.headers.get("user-agent") ?? null,
        grantedAt: new Date(),
      },
    });
  } catch {
    // Kayıt tutulamasa bile kullanıcı siteye girebilmeli.
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(AGE_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return res;
}
