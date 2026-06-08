import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json() as { code: string; subtotal: number };

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Kupon kodu boş olamaz." }, { status: 400 });
    }
    if (typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json({ error: "Geçersiz sepet tutarı." }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Bu kupon kodu geçerli değil." }, { status: 422 });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ error: "Bu kupon artık aktif değil." }, { status: 422 });
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ error: "Bu kupon henüz geçerli değil." }, { status: 422 });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ error: "Bu kuponun süresi dolmuş." }, { status: 422 });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Bu kuponun kullanım limiti dolmuş." }, { status: 422 });
    }
    if (coupon.minOrderAmount !== null) {
      const min = Number(coupon.minOrderAmount);
      if (subtotal < min) {
        return NextResponse.json(
          { error: `Bu kupon için minimum sipariş tutarı ₺${min.toLocaleString("tr-TR")} olmalıdır.` },
          { status: 422 }
        );
      }
    }

    const value = Number(coupon.value);
    const discountAmount =
      coupon.discountType === "YUZDE"
        ? Math.round((subtotal * value) / 100)
        : Math.min(value, subtotal);

    return NextResponse.json({
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
    });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
