import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toTRY, DEFAULT_USD_TRY_RATE, type PriceCurrency } from "@/lib/pricing";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";
import { getAuthUser } from "@/lib/auth/middleware";

/**
 * Müşteriye gösterilmesi güvenli olan (bilinçli olarak yazılmış) hata.
 * Diğer tüm hatalar — özellikle Prisma hataları — tablo/kolon/kısıt adı gibi
 * iç bilgi sızdırdığı için istemciye ham hâlde verilmez.
 */
class CheckoutError extends Error {}

const bodySchema = z.object({
  contact: z.object({
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().min(10).max(30),
    smsConsent: z.boolean(),
    emailMarketingConsent: z.boolean().optional(),
  }),
  address: z.object({
    ad: z.string().min(1).max(80),
    soyad: z.string().min(1).max(80),
    adres: z.string().max(500).default(""),
    ilce: z.string().max(80).default(""),
    sehir: z.string().max(80).default(""),
    postaKodu: z.string().max(20).optional(),
  }),
  shippingMethod: z.enum(["AYNI_GUN", "YURT_ICI", "DUKKAN_TESLIM"]),
  paymentMethod: z.enum(["KREDI_KARTI", "HAVALE_EFT"]),
  // Üst sınırlar: tek istekle SERIALIZABLE transaction içinde binlerce yazma
  // tetiklenmesini (DoS) engeller.
  items: z.array(z.object({
    productId: z.string().min(1).max(40),
    quantity: z.number().int().min(1).max(99),
    variantId: z.string().min(1).max(40).optional(),
  })).min(1).max(50),
  couponCode: z.string().trim().max(40).optional(),
  customerNote: z.string().trim().max(1000).optional(),
});

/** Aynı ürün/varyant birden fazla satırda gelebilir — stok kontrolü için toplanır. */
function stockKey(productId: string, variantId?: string | null): string {
  return `${productId}|${variantId ?? ""}`;
}

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
  // Onay kaydı (ConsentLog) hukuki bir belgedir; IP doğrulanmış kaynaktan alınır.
  const ipAddress = ip === "unknown" ? null : ip;
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

  const { contact, address, shippingMethod, paymentMethod, items, couponCode, customerNote } = parsed.data;

  // Oturum açıksa kimlik istemciden DEĞİL token'dan alınır: aksi hâlde giriş
  // yapmış biri gövdeye başkasının e-postasını yazarak siparişi o hesaba
  // bağlayabiliyordu.
  const authUser = await getAuthUser(req);

  try {
    /* ── 0. Transaction ÖNCESİ hazırlık ──
       Bu üç iş de stok tutarlılığı gerektirmez ama pahalıdır. Transaction'ın
       İÇİNDE yapıldıklarında SERIALIZABLE kilit penceresini uzatıyor, her
       serileştirme yeniden denemesinde baştan tekrarlanıyor ve "ödemeye geç"
       sonrası bekleme süresini büyütüyorlardı. Artık paralel ve tek seferlik. */
    const [siteSettings, shippingOpt, guestPasswordHash] = await Promise.all([
      prisma.siteSettings.findUnique({
        where:  { id: "site" },
        select: { freeShippingThreshold: true, shippingCost: true, usdTryRate: true, ecommerceEnabled: true },
      }),
      prisma.shippingOption.findUnique({
        where:  { code: shippingMethod },
        select: { alwaysFree: true, price: true, label: true },
      }),
      // bcrypt tek başına ~100 ms CPU harcar; yalnızca misafir akışında gerekir.
      authUser ? Promise.resolve<string | null>(null) : bcrypt.hash(randomUUID(), 10),
    ]);

    // "Satışı kapat" anahtarı panelde vardı ama sunucuda uygulanmıyordu.
    if (siteSettings && siteSettings.ecommerceEnabled === false) {
      throw new CheckoutError("Şu anda sipariş alınamıyor. Lütfen daha sonra tekrar deneyin.");
    }

    const usdTryRate = siteSettings?.usdTryRate != null
      ? Number(siteSettings.usdTryRate)
      : DEFAULT_USD_TRY_RATE;

    const result = await runWithRetry(() => prisma.$transaction(async (tx) => {
      /* ── 1. Find or create guest user ── */
      let user = authUser
        ? await tx.user.findUnique({ where: { id: authUser.userId } })
        : null;
      // Oturumdaki kullanıcı silinmiş/pasifse siparişi kabul etme.
      if (authUser && (!user || !user.isActive)) {
        throw new CheckoutError("Oturumunuz geçersiz. Lütfen tekrar giriş yapın.");
      }

      // Misafir akışı: e-posta sahipliği doğrulanamadığı için yalnızca
      // MEVCUT hesaba bağlanır ya da yeni bir hesap açılır.
      const isNewGuestAccount = !user;
      if (!user) {
        user = await tx.user.findFirst({
          where: { email: { equals: contact.email, mode: "insensitive" } },
        });
      }

      let createdNow = false;
      if (!user) {
        // Hash transaction dışında hesaplandı (bkz. adım 0).
        const passwordHash = guestPasswordHash ?? await bcrypt.hash(randomUUID(), 10);
        user = await tx.user.create({
          data: {
            email: contact.email,
            passwordHash,
            fullName: `${address.ad} ${address.soyad}`,
            phone: contact.phone,
            ageVerified: true,
          },
        });
        createdNow = true;
      }

      // Ticari ileti onayı yalnızca e-posta sahipliği kanıtlanmışsa işlenir:
      // ya oturum açık ya da hesap bu siparişle yeni oluşturuldu. Aksi hâlde
      // birinin e-postasını yazan üçüncü kişi onu pazarlama listesine ekleyebilirdi.
      const canRecordMarketingConsent =
        Boolean(authUser) || (isNewGuestAccount && createdNow);

      /* ── 2. Fetch products + variants from DB ── */
      const uniqueProductIds = [...new Set(items.map(i => i.productId))];
      const dbProducts = await tx.product.findMany({
        where: { id: { in: uniqueProductIds }, isActive: true },
        include: { Inventory: true, ProductImage: { where: { isPrimary: true }, take: 1 } },
      });

      if (dbProducts.length !== uniqueProductIds.length) {
        throw new CheckoutError("Sepetteki bazı ürünler artık mevcut değil.");
      }

      // Varyant sorgusu ürüne BAĞLANIR ve aktiflik filtrelenir. Aksi hâlde
      // ucuz bir ürünün id'si + pahalı başka bir ürünün varyant id'si
      // gönderilerek pahalı varyant ucuz fiyata satın alınabiliyordu.
      const variantIds = [...new Set(items.map(i => i.variantId).filter((v): v is string => !!v))];
      const dbVariants = variantIds.length > 0
        ? await tx.productVariant.findMany({
            where: { id: { in: variantIds }, isActive: true, productId: { in: uniqueProductIds } },
            include: { Inventory: true },
          })
        : [];
      const variantById = new Map(dbVariants.map(v => [v.id, v]));
      for (const item of items) {
        if (!item.variantId) continue;
        const variant = variantById.get(item.variantId);
        if (!variant || variant.productId !== item.productId) {
          throw new CheckoutError("Seçilen renk/varyant artık mevcut değil.");
        }
      }

      /* ── 3. Stock validation ──
         Aynı ürün/varyant birden fazla satırda gelebildiği için kontrol
         SATIR bazında değil, ENVANTER bazında toplanarak yapılır; aksi hâlde
         aynı ürünü 3 satıra bölerek stoğun 3 katı sipariş edilebiliyordu. */
      const needByKey = new Map<string, number>();
      for (const item of items) {
        const k = stockKey(item.productId, item.variantId);
        needByKey.set(k, (needByKey.get(k) ?? 0) + item.quantity);
      }
      // Varyantlı satışta ürün-düzeyi toplam stok da düşülüyor → onu da topla.
      const productLevelNeed = new Map<string, number>();
      for (const item of items) {
        productLevelNeed.set(
          item.productId,
          (productLevelNeed.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [key, need] of needByKey) {
        const [productId, variantId] = key.split("|");
        const product = dbProducts.find(p => p.id === productId)!;
        if (variantId) {
          const variant = variantById.get(variantId)!;
          const available = variant.Inventory?.quantity ?? 0;
          if (available < need) {
            throw new CheckoutError(`"${product.name}" (${variant.name}) için yeterli stok yok. Kalan: ${available}`);
          }
        } else {
          const available = product.Inventory?.quantity ?? 0;
          if (available < need) {
            throw new CheckoutError(`"${product.name}" için yeterli stok yok. Kalan: ${available}`);
          }
        }
      }
      // Ürün-düzeyi toplam stok, varyant toplamlarını da karşılamalı.
      for (const [productId, need] of productLevelNeed) {
        const product = dbProducts.find(p => p.id === productId)!;
        const available = product.Inventory?.quantity ?? 0;
        if (product.Inventory && available < need) {
          throw new CheckoutError(`"${product.name}" için yeterli stok yok. Kalan: ${available}`);
        }
      }

      /* ── 4. siteSettings + kargo seçeneği: adım 0'da (transaction dışında) okundu ── */

      /* ── 5. Compute prices from DB (convert USD → TRY if needed) ── */
      // Birim fiyat: varyant seçiliyse varyantın kendi fiyatı geçerlidir
      // (şemada tanımlı ama daha önce hiç okunmuyordu → farklı fiyatlı
      // varyantlar taban fiyattan satılıyordu).
      const unitPriceOf = (item: (typeof items)[number]): number => {
        const product = dbProducts.find(p => p.id === item.productId)!;
        const variant = item.variantId ? variantById.get(item.variantId)! : null;
        const currency = (product.priceCurrency ?? "TRY") as PriceCurrency;
        const raw = variant ? Number(variant.price) : Number(product.basePrice);
        return toTRY(raw, currency, usdTryRate);
      };

      const subtotal = items.reduce(
        (sum, item) => sum + unitPriceOf(item) * item.quantity,
        0,
      );

      /* ── 6. Coupon validation ── */
      let discountTotal = 0;
      let coupon = null;

      if (couponCode) {
        // Kod normalize edilir — sepet önizlemesi (/api/kupon) de öyle yapıyor;
        // aksi hâlde "yaz25" sepette indirimli görünüp siparişte sessizce düşüyordu.
        coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        const now = new Date();

        // Kullanıcı başına kullanım limiti — şemada ve admin panelinde var,
        // ama sipariş akışında hiç uygulanmıyordu (sınırsız tekrar kullanım).
        const usedByUser = coupon?.maxUsesPerUser
          ? await tx.order.count({
              where: { couponId: coupon.id, userId: user.id, status: { not: "IPTAL_EDILDI" } },
            })
          : 0;

        if (
          coupon &&
          coupon.isActive &&
          (!coupon.startsAt || coupon.startsAt <= now) &&
          (!coupon.expiresAt || coupon.expiresAt > now) &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
          (!coupon.maxUsesPerUser || usedByUser < coupon.maxUsesPerUser) &&
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
      // Sipariş numarası e-postada ve destek yazışmalarında dolaşır; durum
      // sayfalarını açmak için tek başına yeterli SAYILMAZ. Gizli erişim
      // anahtarı yalnızca yönlendirme bağlantılarında taşınır.
      const accessToken = randomBytes(16).toString("base64url");
      const order = await tx.order.create({
        data: {
          orderNumber,
          accessToken,
          userId: user.id,
          subtotal,
          discountTotal,
          shippingTotal,
          grandTotal,
          couponId: coupon?.id ?? null,
          shippingAddress: addrJson,
          billingAddress: addrJson,
          customerNote: customerNote || null,
          placedAt: new Date(),
        },
      });

      /* ── 10. Create OrderItems ──
         Satır başına ayrı INSERT yerine tek createMany: 50 kalemlik sepette
         50 ayrı DB gidiş-dönüşü yerine bir tane yapılır. */
      const emailItems: { name: string; quantity: number; lineTotal: number }[] = [];
      const orderItemRows = items.map((item) => {
        const product = dbProducts.find(p => p.id === item.productId)!;
        const variant = item.variantId ? variantById.get(item.variantId)! : null;
        const colorName = variant ? (((variant.attributes as Record<string, string> | null)?.renk) ?? variant.name) : null;
        const unitPriceTRY = unitPriceOf(item);
        const lineTotal = unitPriceTRY * item.quantity;
        const emailName = colorName ? `${product.name} (${colorName})` : product.name;
        emailItems.push({ name: emailName, quantity: item.quantity, lineTotal });
        return {
          orderId: order.id,
          productId: product.id,
          variantId: variant?.id ?? null,
          productName: product.name,
          variantName: colorName,
          sku: variant?.sku ?? product.sku,
          unitPrice: unitPriceTRY,
          quantity: item.quantity,
          lineTotal,
        };
      });
      await tx.orderItem.createMany({ data: orderItemRows });

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

      /* ── 13. Stock movements + inventory update (varyant varsa varyant stoğu) ──
         Envanter bazında TOPLANIR: aynı ürün birden fazla satırdaysa tek update
         yeter. Hareket (StockMovement) kayıtları da tek createMany ile yazılır.
         Ürün-düzeyi düşüş için de artık hareket kaydı üretiliyor; iptal yolu
         (restoreOrderStock) zaten iki envanteri de geri yüklüyordu, hareket
         defteri böylece simetrik oluyor. */
      const decByInventory = new Map<string, number>();
      const addDec = (inventoryId: string, qty: number) => {
        decByInventory.set(inventoryId, (decByInventory.get(inventoryId) ?? 0) + qty);
      };
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId)!;
        const inv = item.variantId ? variantById.get(item.variantId)?.Inventory : product.Inventory;
        if (inv) addDec(inv.id, item.quantity);
        // Renkli üründe ürün-düzeyi toplam stoğu da düşür (listeleme kartı gösterimi senkron kalsın).
        if (item.variantId && product.Inventory) addDec(product.Inventory.id, item.quantity);
      }

      for (const [inventoryId, qty] of decByInventory) {
        await tx.inventory.update({
          where: { id: inventoryId },
          data: { quantity: { decrement: qty } },
        });
      }
      if (decByInventory.size > 0) {
        await tx.stockMovement.createMany({
          data: [...decByInventory].map(([inventoryId, qty]) => ({
            inventoryId,
            type: "SATIS" as const,
            quantityChange: -qty,
            reason: "Sipariş",
            referenceType: "Order",
            referenceId: order.id,
          })),
        });
      }

      /* ── 14. Consent logs (tek createMany) ── */
      const consentTypes: Array<"MESAFELI_SATIS" | "ON_BILGILENDIRME" | "KVKK_AYDINLATMA" | "TICARI_ILETI"> = [
        "MESAFELI_SATIS",
        "ON_BILGILENDIRME",
        "KVKK_AYDINLATMA",
      ];
      // Ticari ileti (pazarlama) onayı verildiyse ayrıca kaydet — yalnızca
      // e-posta sahipliği kanıtlanmışsa (bkz. canRecordMarketingConsent).
      if (contact.emailMarketingConsent && canRecordMarketingConsent) {
        consentTypes.push("TICARI_ILETI");
      }
      const grantedAt = new Date();
      const consentUserId = user.id;
      await tx.consentLog.createMany({
        data: consentTypes.map((consentType) => ({
          userId: consentUserId,
          email: contact.email,
          consentType,
          textVersion: "v1.0",
          granted: true,
          ipAddress,
          userAgent,
          grantedAt,
        })),
      });

      /* ── 15. Increment coupon usedCount ── */
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return {
        orderNumber,
        accessToken,
        customerEmail: user.email,
        grandTotal,
        emailItems,
        userId: user.id,
        marketingConsent: Boolean(contact.emailMarketingConsent) && canRecordMarketingConsent,
      };
    }, {
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }));

    /* Sipariş onay e-postası (env-gated; hata sipariş akışını kırmaz).
     *
     * ÖNEMLİ: Kart ödemesinde burada e-posta GÖNDERİLMEZ. Bu noktada müşteri
     * henüz PayTR formunu bile görmedi; "siparişiniz alındı" maili almak
     * yanıltıcıydı. Kart akışında onay maili, ödeme gerçekten başarıya
     * geçtiğinde PayTR Bildirim URL'inden (ya da mutabakat cron'undan)
     * `sendOrderPaidEmail` ile gönderilir.
     *
     * Havale/EFT'de tahsilat zaten sonradan elle yapılır; siparişin kaydedildiğini
     * ve havale talimatını bildiren bu e-posta burada anlamlıdır. */
    if (paymentMethod === "HAVALE_EFT") {
      try {
        const { orderConfirmationEmail } = await import("@/lib/email/templates");
        const { sendEmail } = await import("@/lib/email/resend");
        const mail = orderConfirmationEmail({
          orderNumber: result.orderNumber,
          items: result.emailItems,
          grandTotal: result.grandTotal,
          paymentMethod,
          variant: "alindi",
        });
        await sendEmail({ to: result.customerEmail, subject: mail.subject, html: mail.html });
      } catch { /* e-posta hatası yoksay */ }
    }

    // Pazarlama izni (checkout'ta onaylandıysa ve e-posta sahipliği kanıtlıysa).
    if (result.marketingConsent) {
      try {
        const { optInUserToMarketing } = await import("@/lib/email/marketing");
        await optInUserToMarketing(result.userId);
      } catch { /* izin hatası siparişi etkilemez */ }
    }

    /* Sepeti "siparişe dönüştü" işaretle — yalnızca Havale/EFT'de.
     *
     * Kart ödemesinde sipariş bu noktada sadece BEKLIYOR durumundadır; müşteri
     * ödemeden vazgeçerse sepetini kapatmış olmak yanlıştır (hem sepet
     * hatırlatması gitmez hem de kullanıcı sepetini kaybetmiş görünür).
     * Kart akışında bu işaretleme ödeme onaylanınca yapılır (bkz.
     * lib/payment/notify.ts). */
    if (paymentMethod === "HAVALE_EFT") {
      try {
        await prisma.cart.updateMany({
          where: { userId: result.userId, status: "AKTIF" },
          data: { status: "SIPARISE_DONUSTU" },
        });
      } catch { /* sepet işaretleme hatası siparişi etkilemez */ }
    }

    // paymentMethod istemciye geri döner: kart ise PayTR iframe sayfasına yönlendirilir.
    // orderToken, sipariş durum sayfalarını açmak için gereken gizli anahtardır.
    return NextResponse.json({
      orderNumber: result.orderNumber,
      orderToken: result.accessToken,
      paymentMethod,
    });
  } catch (err) {
    if (isSerializationError(err)) {
      return NextResponse.json(
        { error: "Sipariş şu anda oluşturulamadı, lütfen birkaç saniye sonra tekrar deneyin." },
        { status: 503 },
      );
    }
    // Yalnızca bilinçli olarak yazılmış (CheckoutError) mesajlar dışarı verilir.
    // Prisma/altyapı hataları tablo, kolon ve kısıt adı sızdırdığı için
    // istemciye genel bir mesaj döner; ayrıntı sunucu log'unda kalır.
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[siparis] beklenmeyen hata:", err);
    return NextResponse.json(
      { error: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
