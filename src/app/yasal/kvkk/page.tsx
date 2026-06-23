import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Half Leaf KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

export default function KVKKPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">KVKK Aydınlatma Metni</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Ocak 2025</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>
          Half Leaf olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında kişisel verilerinizin işlenmesine ilişkin sizi aydınlatmak amacıyla bu metni hazırladık.
        </p>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">1. Veri Sorumlusu</h2>
          <p>Half Leaf — Akdaş Ticaret (Vergi No: 0200526472; bundan sonra &quot;Şirket&quot; olarak anılacaktır) veri sorumlusu sıfatıyla hareket etmektedir.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">2. İşlenen Kişisel Veriler</h2>
          <p>Ad-soyad, e-posta adresi, telefon numarası, teslimat adresi, sipariş geçmişi ve ödeme bilgileri (kart numarası tarafımızca depolanmaz) işlenmektedir.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">3. İşleme Amaçları</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Sipariş oluşturma, takip ve teslimat süreçlerinin yönetimi</li>
            <li>Müşteri hizmetleri ve destek</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>İzin verilen pazarlama iletişimleri</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">4. Haklarınız</h2>
          <p>KVKK&apos;nın 11. maddesi kapsamında kişisel verilerinize ilişkin; bilgi talep etme, düzeltme, silme, işlemenin kısıtlanması ve itiraz haklarına sahipsiniz. Talepleriniz için <a href="mailto:kvkk@halfleafstore.com" className="text-gold hover:underline">kvkk@halfleafstore.com</a> adresine başvurabilirsiniz.</p>
        </section>
      </div>
    </div>
  );
}
