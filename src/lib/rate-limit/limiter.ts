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

// ─── Singleton ────────────────────────────────────────────────────────────────

export const rateLimiter: RateLimiter = new InMemoryRateLimiter();

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
