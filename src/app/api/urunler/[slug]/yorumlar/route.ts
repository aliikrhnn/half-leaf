/**
 * Ürün yorumu gönderme. Yorum moderasyon için isApproved=false oluşturulur;
 * onaylandıktan sonra ürün sayfasında yayınlanır. Rate-limitlidir.
 * E-posta verilirse ve bu e-postayla bu ürünü içeren bir sipariş varsa
 * "doğrulanmış alışveriş" (isVerified) işaretlenir.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export const runtime = "nodejs";

const BodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  authorName: z.string().trim().min(2).max(60),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(5).max(2000),
  email: z.string().trim().email().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`yorum:${ip}`, { maxRequests: 5, windowMs: 60 * 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Çok fazla yorum gönderdiniz. Lütfen bir süre sonra tekrar deneyin." }, { status: 429 });
  }

  const { slug } = await params;

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yorum bilgileri eksik veya hatalı." }, { status: 400 });
  }
  const data = parsed.data;

  const product = await prisma.product.findUnique({ where: { slug, isActive: true }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });

  // Doğrulanmış alışveriş kontrolü (opsiyonel).
  let userId: string | null = null;
  let isVerified = false;
  if (data.email) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: data.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (user) {
      userId = user.id;
      const purchased = await prisma.orderItem.findFirst({
        where: { productId: product.id, Order: { userId: user.id } },
        select: { id: true },
      });
      isVerified = Boolean(purchased);
    }
  }

  await prisma.review.create({
    data: {
      productId: product.id,
      userId,
      authorName: data.authorName,
      rating: data.rating,
      title: data.title || null,
      body: data.body,
      isApproved: false,
      isVerified,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır. Teşekkürler!",
  });
}
