/**
 * Pazarlama izni / abonelik yardımcıları (yalnızca sunucu).
 */

import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";

/** Abonelik iptali (unsubscribe) URL'si. */
export function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/abonelik-iptal?token=${encodeURIComponent(token)}`;
}

/** Yeni abonelik iptali token'ı üretir. */
export function newUnsubscribeToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Kullanıcıya pazarlama (ticari ileti) izni verir ve token üretir (yoksa).
 * @returns unsubscribe token
 */
export async function optInUserToMarketing(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { unsubscribeToken: true },
  });
  const token = existing?.unsubscribeToken ?? newUnsubscribeToken();
  await prisma.user.update({
    where: { id: userId },
    data: { marketingOptIn: true, marketingOptInAt: new Date(), unsubscribeToken: token },
  });
  return token;
}
