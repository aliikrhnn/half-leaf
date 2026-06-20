/**
 * In-memory rate limiter — fixed window algoritması.
 *
 * Deploy turunda Upstash Redis tabanlı arka uca geçilecek.
 * checkLimit imzası aynı kalmalı; sadece Map yerine Upstash REST API
 * çağrısı yapan ikinci bir implementasyon yazılıp `rateLimiter` sabiti
 * değiştirilerek tüm endpoint'lerde sıfır kod değişikliğiyle
 * production-grade limiter aktif edilecek.
 */

import { NextRequest } from "next/server";

// ─── Arayüz ──────────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimiter {
  checkLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

// ─── In-memory implementasyon ─────────────────────────────────────────────────

type Entry = { count: number; resetAt: number };

class InMemoryRateLimiter implements RateLimiter {
  private readonly store = new Map<string, Entry>();
  private lastCleanup = Date.now();

  /**
   * Hafıza sızıntısını önlemek için: her checkLimit çağrısında
   * cleanupIntervalMs süresi geçmişse süresi dolmuş girdiler temizlenir.
   */
  private readonly cleanupIntervalMs: number;

  constructor(cleanupIntervalMs = 5 * 60_000) {
    this.cleanupIntervalMs = cleanupIntervalMs;
  }

  async checkLimit(
    key: string,
    { maxRequests, windowMs }: RateLimitOptions,
  ): Promise<RateLimitResult> {
    const now = Date.now();

    // Lazy cleanup — setInterval kullanmadan hafıza yönetimi
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      for (const [k, e] of this.store.entries()) {
        if (now > e.resetAt) this.store.delete(k);
      }
      this.lastCleanup = now;
    }

    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt: new Date(resetAt) };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: new Date(entry.resetAt),
    };
  }
}

// ─── Upstash Redis (REST) implementasyonu ────────────────────────────────────

/**
 * Serverless/çok-instance ortamda paylaşılan, kalıcı rate limiting.
 * Upstash Redis REST API kullanır (ek bağımlılık YOK — fetch ile).
 * UPSTASH_REDIS_REST_URL ve UPSTASH_REDIS_REST_TOKEN tanımlıysa devreye girer.
 */
class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async checkLimit(
    key: string,
    { maxRequests, windowMs }: RateLimitOptions,
  ): Promise<RateLimitResult> {
    const k = `rl:${key}`;
    // Sabit pencere: INCR + ilk istekte PEXPIRE(NX), TTL'i oku.
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", k],
        ["PEXPIRE", k, windowMs, "NX"],
        ["PTTL", k],
      ]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
    const data = (await res.json()) as Array<{ result: number }>;
    const count = Number(data[0]?.result ?? 1);
    const ttl = Number(data[2]?.result ?? windowMs);
    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl : windowMs));

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: Math.max(0, maxRequests - count), resetAt };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const memoryLimiter = new InMemoryRateLimiter();

function createRateLimiter(): RateLimiter {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    const upstash = new UpstashRateLimiter(url, token);
    // Upstash erişilemezse siteyi kilitlememek için in-memory'e düş.
    return {
      checkLimit: async (key, opts) => {
        try {
          return await upstash.checkLimit(key, opts);
        } catch {
          return memoryLimiter.checkLimit(key, opts);
        }
      },
    };
  }

  return memoryLimiter;
}

export const rateLimiter: RateLimiter = createRateLimiter();

// ─── Yardımcı: IP adresi ─────────────────────────────────────────────────────

/**
 * İstemci IP adresini döndürür.
 * x-forwarded-for başlığında birden fazla IP varsa ilkini alır (gerçek istemci).
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
