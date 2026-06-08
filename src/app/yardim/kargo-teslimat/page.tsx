import type { Metadata } from "next";
import { Truck, Clock, MapPin, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Kargo & Teslimat",
  description: "Half Leaf kargo seçenekleri, teslimat süreleri ve ücretsiz kargo koşulları hakkında bilgi alın.",
  openGraph: { title: "Kargo & Teslimat | Half Leaf", description: "Teslimat süreleri, kargo ücretleri ve ücretsiz kargo koşulları." },
};

export default function KargoTeslimatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yardım</p>
        <h1 className="text-4xl font-bold text-ink mb-3">Kargo &amp; Teslimat</h1>
        <p className="text-ink-muted">Siparişlerinizin kargo ve teslimat süreci hakkında bilgi.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: Truck, title: "Kargo Ücreti", desc: "Belirli bir tutar üzeri ücretsiz, altında sabit kargo ücreti uygulanır." },
          { icon: Clock, title: "Hazırlık Süresi", desc: "14:00'den önce verilen siparişler aynı gün kargoya verilir." },
          { icon: MapPin, title: "Teslimat Bölgesi", desc: "Türkiye geneli teslimat yapılmaktadır." },
          { icon: Package, title: "Teslimat Süresi", desc: "Kargoya verilmesinin ardından 1–3 iş günü içinde teslim." },
        ].map(({ icon: Icon, title, desc }) => (
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

      <div className="space-y-6 text-ink-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Kargo Firmaları</h2>
          <p>Siparişler anlaşmalı kargo firmaları aracılığıyla gönderilmektedir. Kargo firması seçimi sipariş konumuna ve stok durumuna göre belirlenir.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Adres Değişikliği</h2>
          <p>Siparişiniz kargoya verilmeden önce adres değişikliği yapılabilir. Kargoya verildikten sonra adres değişikliği mümkün değildir.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Hasarlı Teslimat</h2>
          <p>Ürünü teslim alırken hasarlı gördüğünüzde, tutanak tutturarak kargoyu iade edebilirsiniz. Müşteri hizmetleriyle iletişime geçin.</p>
        </section>
      </div>
    </div>
  );
}
