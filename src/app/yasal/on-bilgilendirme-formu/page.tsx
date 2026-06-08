import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu",
  description: "Half Leaf ön bilgilendirme formu. Satın alma öncesi yasal bilgilendirme.",
};

export default function OnBilgilendirmeFormPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Ön Bilgilendirme Formu</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Ocak 2025</p>
      </div>
      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında tarafınıza sunulmaktadır.</p>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Satıcı Bilgileri</h2>
          <p>Half Leaf — İstanbul, Türkiye</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Ürün Bilgileri</h2>
          <p>Sipariş edilen ürünlerin temel özellikleri, fiyatı (KDV dahil), adedi ve toplam tutarı sipariş özetinde yer almaktadır.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Ödeme ve Teslimat</h2>
          <p>Ödeme, sipariş tamamlanırken seçilen yöntemle alınır. Teslimat, kargo firması aracılığıyla sipariş adresine yapılır. Tahmini teslimat süresi 1–3 iş günüdür.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Cayma Hakkı</h2>
          <p>Teslim tarihinden itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Cayma bildiriminizi müşteri hizmetlerimize iletmeniz yeterlidir.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Cayma Hakkının Kullanılamayacağı Haller</h2>
          <p>Ambalajı açılmış hijyenik ürünlerde (ağızlık vb.) cayma hakkı kullanılamaz.</p>
        </section>
      </div>
    </div>
  );
}
