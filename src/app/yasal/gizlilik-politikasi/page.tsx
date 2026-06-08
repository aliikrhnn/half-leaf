import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Half Leaf gizlilik politikası. Kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuzu öğrenin.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Gizlilik Politikası</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Ocak 2025</p>
      </div>
      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>Bu gizlilik politikası, Half Leaf web sitesini ziyaret ettiğinizde veya satın alma yaptığınızda kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve paylaştığımızı açıklar.</p>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Topladığımız Bilgiler</h2>
          <p>Siparişinizi tamamlarken ad, adres, e-posta ve telefon bilgileri toplanır. Sitemizi ziyaret ettiğinizde çerezler aracılığıyla tarama verileri elde edilebilir.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Bilgilerin Kullanımı</h2>
          <p>Topladığımız bilgiler; siparişlerinizi işlemek, ödeme işlemlerini gerçekleştirmek, ürünleri teslim etmek ve müşteri hizmetleri sağlamak amacıyla kullanılır.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Üçüncü Taraflarla Paylaşım</h2>
          <p>Kişisel verileriniz; kargo firmaları, ödeme aracı kuruluşları ve yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Veri Güvenliği</h2>
          <p>Kişisel verilerinizi yetkisiz erişim, değiştirme veya ifşaya karşı korumak için uygun güvenlik önlemleri alınmaktadır.</p>
        </section>
      </div>
    </div>
  );
}
