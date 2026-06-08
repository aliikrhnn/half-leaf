import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Half Leaf — nargile ekipmanlarını modern tasarımla buluşturan marka. Hikayemizi keşfedin.",
  openGraph: { title: "Hakkımızda | Half Leaf", description: "Nargile ekipmanlarını modern tasarımla buluşturan marka hikayemiz." },
};

export default function HakkimizdaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">
          Kurumsal
        </p>
        <h1 className="text-4xl font-bold text-ink mb-4">Hakkımızda</h1>
        <p className="text-ink-muted text-lg leading-relaxed">
          Half Leaf, modern nargile ekipmanları alanında premium ürün seçkisi sunan bir e-ticaret platformudur.
        </p>
      </div>

      <div className="space-y-8 text-ink-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">Misyonumuz</h2>
          <p>
            Nargile ekipmanı tutkunlarına kaliteli, güvenilir ve estetik açıdan üstün ürünler sunmak temel amacımızdır. Her ürün titizlikle seçilmiş ve kalite standartlarımıza uygunluğu test edilmiştir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">Ürün Seçkimiz</h2>
          <p>
            Cam haznelerden gövdelere, lülelerden kamışlara ve aksesuarlara uzanan geniş ürün yelpazemiz; üretici fabrikalardan doğrudan temin edilmektedir. Satışa sunulan her ürün, dayanıklılık ve kullanım konforu açısından değerlendirme sürecinden geçmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">Güvenli Alışveriş</h2>
          <p>
            SSL şifreli ödeme altyapısı, kolay iade süreci ve müşteri hizmetleri desteğiyle güvenli bir alışveriş deneyimi sunmayı taahhüt ediyoruz. Satın aldığınız ürünler belirtilen süre içinde kapınıza ulaştırılır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">+18 Politikası</h2>
          <p>
            Sitemiz ve sunulan tüm ürünler yalnızca 18 yaş ve üzeri bireyler içindir. Bu politikayı titizlikle uygular ve yaş doğrulamasını zorunlu tutarız.
          </p>
        </section>
      </div>
    </div>
  );
}
