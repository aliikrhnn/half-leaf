/**
 * Oturum tazeliği — JWT imzası doğru olsa bile kullanıcının HÂLÂ yetkili
 * olduğunu doğrular.
 *
 * Neden gerekli: token 7 gün geçerli ve yalnızca imza/exp doğrulanıyordu.
 * Bir müşteri pasifleştirildiğinde ya da bir yöneticinin rolü düşürüldüğünde
 * elindeki token günlerce çalışmaya devam ediyordu; çalınan bir çerezi iptal
 * etmenin de hiçbir yolu yoktu.
 *
 * Maliyeti düşük tutmak için sonuç örnek içinde kısa süre önbelleklenir.
 */

import { prisma } from "@/lib/db/prisma";
import type { TokenPayload } from "./jwt";

interface SessionState {
  isActive: boolean;
  role: "MUSTERI" | "ADMIN";
  tokenVersion: number;
}

/** `unreachable`: veritabanına ulaşılamadı — oturum reddedilmez. */
type LoadResult =
  | { kind: "found"; state: SessionState }
  | { kind: "missing" }
  | { kind: "unreachable" };

const TTL_MS = 15_000;
const cache = new Map<string, { at: number; result: LoadResult }>();

async function loadState(userId: string): Promise<LoadResult> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && now - hit.at < TTL_MS) return hit.result;

  let result: LoadResult;
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, role: true, tokenVersion: true },
    });
    result = row
      ? { kind: "found", state: { isActive: row.isActive, role: row.role, tokenVersion: row.tokenVersion } }
      : { kind: "missing" };
  } catch {
    // Önbelleğe YAZILMAZ ki bir sonraki istekte tekrar denensin.
    return { kind: "unreachable" };
  }

  cache.set(userId, { at: now, result });
  // Bellek sızıntısına karşı basit sınır.
  if (cache.size > 5000) cache.clear();
  return result;
}

/**
 * Token payload'ını veritabanındaki güncel durumla karşılaştırır.
 * Geçerliyse (rolü tazelenmiş) payload'ı, değilse `null` döner.
 */
export async function assertFreshSession(payload: TokenPayload): Promise<TokenPayload | null> {
  const result = await loadState(payload.userId);

  // DB okunamadı → mevcut davranışı koru (yalnızca imza doğrulanmış sayılır).
  if (result.kind === "unreachable") return payload;

  // Kullanıcı silinmiş veya pasif.
  if (result.kind === "missing" || !result.state.isActive) return null;
  const state = result.state;

  // Token iptal edilmiş (tokenVersion artırılmış).
  if (typeof payload.tv === "number" && payload.tv !== state.tokenVersion) return null;
  // Eski token'da tv yoksa yalnızca tokenVersion 0 iken kabul edilir.
  if (typeof payload.tv !== "number" && state.tokenVersion !== 0) return null;

  // Rol her zaman veritabanından gelir — token'daki eski rol değil.
  return { ...payload, role: state.role };
}

/** Kullanıcının tüm oturumlarını geçersiz kılar. */
export async function revokeUserSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
  cache.delete(userId);
}
