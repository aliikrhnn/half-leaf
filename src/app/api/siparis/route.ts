import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toTRY, DEFAULT_USD_TRY_RATE, type PriceCurrency } from "@/lib/pricing";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

const bodySchema = z.object({
  contact: z.object({
    email: z.string().email(),
    phone: z.string().min(10),
    smsConsent: z.boolean(),
  }),
  address: z.object({
    ad: z.string().min(1),
    soyad: z.string().min(1),
    adres: z.string().default(""),
    ilce: z.string().default(""),
    sehir: z.string().default(""),
    postaKodu: z.string().optional(),
  }),
  shippingMethod: z.enum(["AYNI_GUN", "YURT_ICI", "DUKKAN_TESLIM"]),
  paymentMethod: z.enum(["KREDI_KARTI", "HAVALE_EFT"]),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1),
  couponCode: z.string().optional(),
});

// ─── Stok race condition koruması ────────────────────────────────────────────

function isSerializationError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: write conflict / deadlock (Prisma serialization failure)
    return err.code === "P2034";
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("could not serialize") || msg.includes("40001");
}

async function runWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1 && isSerializationError(err)) {
        // 50–200 ms rastgele bekleme (jitter) ile yeniden dene
        const delay = 50 + Math.floor(Math.random() * 150);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limit = await rateLimiter.checkLimit(`siparis:${ip}`, {
    maxRequests: 10,
    windowMs:    60 * 60_000, // 1 saat
  });

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Çok fazla sipariş denemesi yapıldı. Lütfen biraz bekleyip tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? null;
  const userAgent = hdrs.get("user-agent") ?? null;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya hatalı alanlar." }, { status: 400 });
  }

  const { contact, address, shippingMethod, paymentMethod, items, couponCode } = parsed.data;

  try {
    const result = await runWithRetry(() => prisma.$transaction(async (tx) => {
      /* ── 1. Find or create guest user ── */
      let user = await tx.user.findFirst({
        where: { email: { equals: contact.email, mode: "insensitive" } },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash(randomUUID(), 10);
        user = await tx.user.create({
          data: {
            email: contact.email.toLowerCase(),
            passwordHash,
            fullName: `${address.ad} ${address.soyad}`,
            phone: contact.phone,
            ageVerified: true,
          },
        });
      }

      /* ── 2. Fetch products from DB ── */
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { Inventory: true, ProductImage: { where: { isPrimary: true }, take: 1 } },
      });

      if (dbProducts.length !== productIds.length) {
        throw new Error("Sepetteki bazı ürünler artık mevcut değil.");
      }

      /* ── 3. Stock validation ── */
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId)!;
        const available = product.Inventory?.quantity ?? 0;
        if (available < item.quantity) {
          throw new Error(`"${product.name}" için yeterli stok yok. Kalan: ${available}`);
        }
      }

      /* ── 4. Fetch siteSettings (rate + shipping config) ── */
      const siteSettings = await tx.siteSettings.findUnique({
        where:  { id: "site" },
        select: { freeShippingThreshold: true, shippingCost: true, usdTryRate: true },
      });
      const usdTryRate = siteSettings?.usdTryRate != null
        ? Number(siteSettings.usdTryRate)
        : DEFAULT_USD_TRY_RATE;

      /* ── 5. Compute prices from DB (convert USD → TRY if needed) ── */
      const subtotal = dbProducts.reduce((sum, product) => {
        const qty = items.find(i => i.productId === product.id)!.quantity;
        const currency = (product.priceCurrency ?? "TRY") as PriceCurrency;
        const priceInTRY = toTRY(Number(product.basePrice), currency, usdTryRate);
        return sum + priceInTRY * qty;
      }, 0);

      /* ── 6. Coupon validation ── */
      let discountTotal = 0;
      let coupon = null;

      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        const now = new Date();

        if (
          coupon &&
          coupon.isActive &&
          (!coupon.startsAt || coupon.startsAt <= now) &&
          (!coupon.expiresAt || coupon.expiresAt > now) &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
          (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount))
        ) {
          if (coupon.discountType === "YUZDE") {
            discountTotal = Math.round((subtotal * Number(coupon.value)) / 100);
          } else {
            discountTotal = Math.min(Number(coupon.value), subtotal);
          }
        } else {
          coupon = null;
        }
      }

      const afterDiscount = Math.max(0, subtotal - discountTotal);

      /* ── 7. Shipping cost ── */
      const freeThreshold = Number(siteSettings?.freeShippingThreshold ?? 2500);
      const stdShipping   = Number(siteSettings?.shippingCost ?? 150);

      let shippingTotal: number;
      const shippingOpt = await tx.shippingOption.findUnique({
        where:  { code: shippingMethod },
        select: { alwaysFree: true, price: true, label: true },
      });
      if (shippingOpt?.alwaysFree) {
        shippingTotal = 0;
      } else {
        shippingTotal = afterDiscount >= freeThreshold ? 0 : (shippingOpt ? Number(shippingOpt.price) : stdShipping);
      }

      const grandTotal = afterDiscount + shippingTotal;

      /* ── 8. Build address JSON ── */
      const addrJson = {
        fullName: `${address.ad} ${address.soyad}`,
        phone: contact.phone,
        adres: address.adres,
        ilce: address.ilce,
        sehir: address.sehir,
        postaKodu: address.postaKodu ?? "",
      };

      /* ── 9. Create Order ── */
      // Çakışmaya dayanıklı, alfa-numerik sipariş no (PayTR merchant_oid kısıtına uygun).
      // Date.now() tek başına eşzamanlı isteklerde çakışabildiğinden rastgele sonek eklenir.
      const orderNumber = `HL${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 6)}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal,
          discountTotal,
          shippingTotal,
          grandTotal,
          couponId: coupon?.id ?? null,
          shippingAddress: addrJson,
          billingAddress: addrJson,
          placedAt: new Date(),
        },
      });

      /* ── 10. Create OrderItems ── */
      const emailItems: { name: string; quantity: number; lineTotal: number }[] = [];
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId)!;
        const currency = (product.priceCurrency ?? "TRY") as PriceCurrency;
        const unitPriceTRY = toTRY(Number(product.basePrice), currency, usdTryRate);
        const lineTotal = unitPriceTRY * item.quantity;
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPrice: unitPriceTRY,
            quantity: item.quantity,
            lineTotal,
          },
        });
        emailItems.push({ name: product.name, quantity: item.quantity, lineTotal });
      }

      /* ── 11. Create Payment ── */
      const providerMap: Record<string, string> = {
        KREDI_KARTI: "paytr",
        HAVALE_EFT: "HAVALE_EFT",
      };
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: providerMap[paymentMethod],
          status: "BEKLIYOR",
          amount: grandTotal,
          currency: "TRY",
        },
      });

      /* ── 12. Create Shipment ── */
      const shippingLabel = shippingOpt?.label ?? shippingMethod;
      await tx.shipment.create({
        data: {
          orderId:  order.id,
          provider: shippingLabel,
          status:   "HAZIRLANIYOR",
        },
      });

      /* ── 13. Stock movements + inventory update ── */
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId)!;
        if (product.Inventory) {
          await tx.inventory.update({
            where: { id: product.Inventory.id },
            data: { quantity: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              inventoryId: product.Inventory.id,
              type: "SATIS",
              quantityChange: -item.quantity,
              reason: "Sipariş",
              referenceType: "Order",
              referenceId: order.id,
            },
          });
        }
      }

      /* ── 14. Consent logs ── */
      const consentTypes = ["MESAFELI_SATIS", "ON_BILGILENDIRME", "KVKK_AYDINLATMA"] as const;
      for (const consentType of consentTypes) {
        await tx.consentLog.create({
          data: {
            userId: user.id,
            email: contact.email,
            consentType,
            textVersion: "v1.0",
            granted: true,
            ipAddress,
            userAgent,
            grantedAt: new Date(),
          },
        });
      }

      /* ── 15. Increment coupon usedCount ── */
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return { orderNumber, customerEmail: contact.email, grandTotal, emailItems };
    }, {
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }));

    // Sipariş onay e-postası (env-gated; hata sipariş akışını kırmaz).
    try {
      const { orderConfirmationEmail } = await import("@/lib/email/templates");
      const { sendEmail } = await import("@/lib/email/resend");
      const mail = orderConfirmationEmail({
        orderNumber: result.orderNumber,
        items: result.emailItems,
        grandTotal: result.grandTotal,
        paymentMethod,
      });
      await sendEmail({ to: result.customerEmail, subject: mail.subject, html: mail.html });
    } catch { /* e-posta hatası yoksay */ }

    // paymentMethod istemciye geri döner: kart ise PayTR iframe sayfasına yönlendirilir.
    return NextResponse.json({ orderNumber: result.orderNumber, paymentMethod });
  } catch (err) {
    if (isSerializationError(err)) {
      return NextResponse.json(
        { error: "Sipariş şu anda oluşturulamadı, lütfen birkaç saniye sonra tekrar deneyin." },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Sipariş oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
