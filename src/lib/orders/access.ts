/**
 * Sipariş durum sayfaları için erişim kontrolü.
 *
 * Sipariş numarası e-postalarda, destek yazışmalarında ve tarayıcı
 * geçmişinde dolaşır; tek başına yetki sayılmaz. Bir siparişi görebilmek için
 * ya bağlantıdaki gizli `t` anahtarı doğru olmalı ya da istek siparişin
 * sahibi olarak giriş yapmış olmalıdır.
 */

import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { verifyToken } from "@/lib/auth/jwt";
import { assertFreshSession } from "@/lib/auth/session";

/** Sabit süreli karşılaştırma — anahtar tahmininde zamanlama sızıntısı olmasın. */
function secureEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Giriş yapmış kullanıcının id'si (sunucu bileşeninden okunur). */
export async function currentUserId(): Promise<string | null> {
  try {
    const jar = await cookies();
    const raw = jar.get("hl-token")?.value;
    if (!raw) return null;
    const payload = await verifyToken(raw);
    const fresh = await assertFreshSession(payload);
    return fresh?.userId ?? null;
  } catch {
    return null;
  }
}

export interface OrderAccessSubject {
  accessToken: string | null;
  userId: string;
}

export async function canViewOrder(
  order: OrderAccessSubject,
  providedToken: string | undefined,
): Promise<boolean> {
  if (providedToken && order.accessToken && secureEquals(providedToken, order.accessToken)) {
    return true;
  }
  const uid = await currentUserId();
  return uid !== null && uid === order.userId;
}
