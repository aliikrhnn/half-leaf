import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, MapPin, Package } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kargo & Teslimat Koşulları",
  description:
    "Half Leaf kargo seçenekleri, teslimat süreleri, ücretsiz kargo eşiği, hasarlı teslimat ve yasal 30 günlük teslim süresi hakkında bilgi.",
  openGraph: {
    title: "Kargo & Teslimat | Half Leaf",
    description: "Teslimat süreleri, kargo ücretleri ve ücretsiz kargo koşulları.",
  },
  robots: { index: true, follow: true },
};

async function getShipping() {
  try {
    return await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: { freeShippingThreshold: true, shippingCost: true },
    });
  } catch {
    return null;
  }
}

export default async function KargoTeslimatPage() {
  const s = await getShipping();
  const freeThreshold = Number(s?.freeShippingThreshold ?? 2500);
  const shippingCost = Number(s?.shippingCost ?? 150);

  const cards = [
    {
      icon: Truck,
      title: "Kargo Ücreti",
      desc: `${formatPrice(freeThreshold)} ve üzeri siparişlerde ücretsiz; altındaki siparişlerde ${formatPrice(shippingCost)} sabit kargo ücreti uygulanır.`,
    },
    { icon: Clock, title: "Hazırlık Süresi", desc: "14:00'ten önce verilen siparişler aynı gün kargoya verilir." },
    { icon: MapPin, title: "Teslimat Bölgesi", desc: "Türkiye geneli teslimat yapılmaktadır." },
    { icon: Package, title: "Teslimat Süresi", desc: "Kargoya verilmesinin ardından 1–3 iş günü içinde teslim." },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yardım</p>
        <h1 className="text-4xl font-bold text-ink mb-3">Kargo &amp; Teslimat Koşulları</h1>
        <p className="text-ink-muted">Siparişlerinizin kargo ve teslimat süreci hakkında bilgi.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {cards.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 p-5 bg-bg-card border border-border-default rounded-xl">
            <div className="p-2.5 rounded-lg bg-bg-elevated border border-border-default h-fit">
              <Icon size={18} className="text-gold" />
            </div>
            <div>
              <p className="font-medium text-ink text-sm mb-1">{title}</p>
              <p className="text-sm text-ink-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Yasal Teslim Süresi</h2>
          <p>
            Siparişiniz, onay tarihinden itibaren yasal olarak en geç{" "}
            <strong className="text-ink">30 gün</strong> içinde teslim edilir. Uygulamada teslimat çok
            daha kısa sürede tamamlanır; olağanüstü durumlarda gecikme olması halinde tarafınıza bilgi
            verilir ve dilerseniz siparişinizi iptal edebilirsiniz.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Kargo Firmaları ve Takip</h2>
          <p>
            Siparişler anlaşmalı kargo firmaları aracılığıyla gönderilir. Kargoya verildiğinde takip
            numaranız SMS ve e-posta ile iletilir; takibi kargo firmasının sitesinden veya{" "}
            <Link href="/hesabim" className="text-accent underline">
              hesabınızdan
            </Link>{" "}
            yapabilirsiniz.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Adres Değişikliği</h2>
          <p>
            Siparişiniz kargoya verilmeden önce teslimat adresi değiştirilebilir. Kargoya verildikten
            sonra adres değişikliği mümkün değildir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Hasarlı Teslimat</h2>
          <p>
            Ürünü teslim alırken pakette ezilme/yırtılma/ıslanma gibi bir hasar görürseniz, ürünü teslim
            almadan önce kargo görevlisine <strong className="text-ink">hasar tespit tutanağı</strong>{" "}
            tutturun ve müşteri hizmetlerimizle iletişime geçin. Bu durumda iade/değişim kargo ücreti
            tarafımıza aittir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Teslim Alınamayan Siparişler</h2>
          <p>
            Adreste bulunulmaması nedeniyle teslim edilemeyen siparişler için kargo firması genellikle
            ikinci bir teslimat dener; alınmayan gönderiler tarafımıza iade edilir. Bu durumda bizimle
            iletişime geçerek yeniden gönderim talep edebilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
