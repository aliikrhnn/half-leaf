import { NextRequest } from "next/server";
import { getProductById, updateProduct, deleteProduct, getProductColorVariants } from "@/lib/services/product.service";
import { UpdateProductSchema } from "@/lib/validations/product.schema";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { mapProduct } from "@/lib/db/mappers";
import type { PriceCurrency } from "@/lib/pricing";

type Params = { params: Promise<{ id: string }> };

/**
 * Bu uç YALNIZCA yönetim panelinin ürün düzenleme formu içindir: ham
 * (dönüştürülmemiş) fiyatları, para birimini ve pasif ürünleri döndürür.
 * Herkese açık kalırsa yayınlanmamış ürünler ve iç fiyatlandırma sızar.
 * Storefront için /api/urunler ve /api/products (isActive filtreli) vardır.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) return notFound("Ürün bulunamadı.");
    // Admin düzenleme formu HAM (depolanan para birimindeki) değerleri geri almalı —
    // storefront'un TRY'ye çevrilmiş gösterim değerini değil. basePrice, priceCurrency
    // biriminde girildiği gibi saklanır; TRY'ye çevrim yalnızca okuma anında (mapProduct,
    // storefront) yapılır. Burada mapProduct döndürürsek, USD etiketli alana TRY'ye
    // çevrilmiş sayı yüklenir ve kaydedince fiyat her düzenlemede kur kadar şişer.
    const colors = await getProductColorVariants(id);
    return ok({
      ...mapProduct(product),
      price: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : undefined,
      priceCurrency: (product.priceCurrency ?? "TRY") as PriceCurrency,
      brand: product.brand ?? undefined,
      colors,
    });
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const existing = await getProductById(id);
    if (!existing) return notFound("Ürün bulunamadı.");

    const product = await updateProduct(id, parsed.data);
    return ok(product);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") return badRequest("Bu slug veya SKU zaten kullanılıyor.");
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    const existing = await getProductById(id);
    if (!existing) return notFound("Ürün bulunamadı.");

    await deleteProduct(id);
    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
