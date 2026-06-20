import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "İade & Değişim Koşulları",
  description:
    "Half Leaf iade ve değişim politikası. 6502 sayılı Kanun kapsamında 14 gün cayma hakkı, iade süreci, para iadesi ve ayıplı ürün hakları.",
  openGraph: {
    title: "İade & Değişim | Half Leaf",
    description: "14 gün cayma hakkı, iade süreci ve para iadesi koşulları.",
  },
  robots: { index: true, follow: true },
};

export default function IadeDegisimPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yardım</p>
        <h1 className="text-4xl font-bold text-ink mb-3">İade &amp; Değişim Koşulları</h1>
        <p className="text-ink-muted">
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
          kapsamında haklarınız ve iade süreci.
        </p>
      </div>

      <div className="space-y-8 text-ink-muted leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Cayma Hakkı (14 Gün)</h2>
          <p>
            Ürünü teslim aldığınız tarihten itibaren <strong className="text-ink">14 gün</strong> içinde,
            herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin siparişinizden cayabilirsiniz.
            Cayma bildiriminizi{" "}
            <Link href="/hesabim/iade-taleplerim/yeni" className="text-accent underline">
              hesabınızdaki iade talebi
            </Link>{" "}
            ekranından ya da müşteri hizmetlerimize e-posta ile iletebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">İade Koşulları</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>İade talebi teslim tarihinden itibaren 14 gün içinde oluşturulmalıdır.</li>
            <li>Ürün kullanılmamış, denenmiş olsa dahi yeniden satılabilir durumda olmalıdır.</li>
            <li>Orijinal ambalajı, kutusu, etiketleri ve varsa standart aksesuarları eksiksiz olmalıdır.</li>
            <li>Fatura veya sipariş numarası iade ile birlikte belirtilmelidir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Cayma Hakkının İstisnaları</h2>
          <p>
            Hijyen ve sağlık açısından, ambalajı/koruyucu bandı açıldıktan sonra iadesi uygun olmayan
            kişisel temaslı sarf ürünlerinde (ör. ağızlık/sipsi, marpuç), kişiye özel hazırlanan
            ürünlerde ve niteliği gereği iade edilemeyecek ürünlerde cayma hakkı kullanılamaz
            (Mesafeli Sözleşmeler Yönetmeliği md. 15).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">İade Süreci</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Hesabınızdan veya müşteri hizmetlerimizden iade talebi oluşturun.</li>
            <li>Onaylanan talebiniz için size iletilen yönerge ile ürünü kargoya teslim edin.</li>
            <li>Ürün tarafımıza ulaşıp incelendikten sonra iadeniz onaylanır.</li>
            <li>
              Onay sonrası bedel, <strong className="text-ink">en geç 14 gün</strong> içinde ödeme
              yönteminize iade edilir (kart ödemelerinde PayTR üzerinden aynı kartınıza; bankanıza
              yansıması birkaç iş günü sürebilir).
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Değişim</h2>
          <p>
            Beden/renk/model değişimi talepleriniz stok durumuna bağlı olarak karşılanır. Değişim,
            iade ile aynı koşullara tabidir; aradaki fiyat farkı ve gerekli kargo düzenlemeleri talep
            sırasında bildirilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Ayıplı / Hasarlı Ürün</h2>
          <p>
            Ürün ayıplı (kusurlu) veya kargoda hasar görmüş ise; ücretsiz onarım, ayıpsız misli ile
            değiştirilme, bedel indirimi veya bedel iadesi haklarından dilediğinizi kullanabilirsiniz.
            Bu durumlarda <strong className="text-ink">iade kargo ücreti tarafımıza aittir</strong>.
            Kargoyu hasarlı teslim aldıysanız, kargo görevlisine tutanak tutturmanız sürecinizi
            hızlandırır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Kargo Ücreti</h2>
          <p>
            Bizden kaynaklanan hatalı/ayıplı/hasarlı ürün iadelerinde kargo ücreti tarafımızca
            karşılanır. Cayma hakkı kapsamındaki diğer iadelerde, anlaşmalı kargo dışında bir firma
            kullanılması halinde iade kargo bedeli alıcıya ait olabilir.
          </p>
        </section>
      </div>
    </div>
  );
}
