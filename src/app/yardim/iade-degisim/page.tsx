import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İade & Değişim",
  description: "Half Leaf iade ve değişim politikası. 14 gün içinde koşulsuz iade hakkı.",
  openGraph: { title: "İade & Değişim | Half Leaf", description: "14 gün içinde koşulsuz iade hakkı ve değişim süreci." },
};

export default function IadeDegisimPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yardım</p>
        <h1 className="text-4xl font-bold text-ink mb-3">İade &amp; Değişim</h1>
        <p className="text-ink-muted">İade ve değişim süreçlerine ilişkin bilgiler.</p>
      </div>

      <div className="space-y-8 text-ink-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">İade Koşulları</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Teslim tarihinden itibaren 14 gün içinde iade başlatılmalıdır.</li>
            <li>Ürün kullanılmamış ve orijinal ambalajında olmalıdır.</li>
            <li>Ürüne ait tüm aksesuar ve belgeler eksiksiz iade edilmelidir.</li>
            <li>Hijyenik ürünlerde (ağızlık setleri vb.) ambalaj açılmış ise iade kabul edilmez.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">İade Süreci</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Müşteri hizmetlerimize ulaşarak iade talebinde bulunun.</li>
            <li>Size iletilen iade kodu ile kargoya teslim edin.</li>
            <li>Ürün tarafımıza ulaştığında 5 iş günü içinde ödeme iadesi yapılır.</li>
          </ol>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Değişim</h2>
          <p>Stok durumuna bağlı olarak değişim talebinde bulunabilirsiniz. Değişim süreçleri iade ile aynı şartları taşır.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Kargo Ücreti</h2>
          <p>Tarafımızdan kaynaklanan hatalı veya hasarlı ürünlerde iade kargo ücreti tarafımızca karşılanır. Diğer durumlarda kargo ücreti müşteriye aittir.</p>
        </section>
      </div>
    </div>
  );
}
