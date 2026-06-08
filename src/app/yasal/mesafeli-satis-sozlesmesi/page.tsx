import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Half Leaf mesafeli satış sözleşmesi. Online alışverişinize ilişkin yasal koşullar.",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Mesafeli Satış Sözleşmesi</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Ocak 2025</p>
      </div>
      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>Bu sözleşme, Half Leaf ile müşteri arasında elektronik ortamda gerçekleşen satış işlemlerine ilişkin hüküm ve koşulları düzenlemektedir. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır.</p>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Madde 1 — Taraflar</h2>
          <p><strong className="text-ink">Satıcı:</strong> Half Leaf — İstanbul, Türkiye<br />
          <strong className="text-ink">Alıcı:</strong> Sipariş formunda belirtilen isim ve adres bilgilerine sahip kişi.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Madde 2 — Konu</h2>
          <p>Alıcının sipariş ettiği ürünlerin satışı ve teslimi bu sözleşmenin konusunu oluşturur.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Madde 3 — Ürün Bilgileri</h2>
          <p>Sipariş edilen ürünlerin adı, adedi, fiyatı ve özellikleri sipariş tamamlama ekranında ve onay e-postasında belirtilmektedir.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Madde 4 — Cayma Hakkı</h2>
          <p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma hakkının kullanılması halinde ürün iade edilmelidir.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Madde 5 — Uyuşmazlık Çözümü</h2>
          <p>Taraflar arasındaki uyuşmazlıklarda Türk mahkemeleri ve İl/İlçe Tüketici Hakem Heyetleri yetkilidir.</p>
        </section>
      </div>
    </div>
  );
}
