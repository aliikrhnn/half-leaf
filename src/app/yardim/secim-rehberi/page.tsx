import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nargile Seçim Rehberi",
  description: "Doğru nargile seçimi için kapsamlı rehber. Model, boyut, malzeme ve bütçe karşılaştırması.",
  openGraph: {
    title: "Nargile Seçim Rehberi | Half Leaf",
    description: "İlk nargileniyi mi seçiyorsunuz? Model, boyut ve malzeme farkları.",
  },
};

const sections = [
  {
    heading: "Boyut: Masaüstü mü, Kompakt mı?",
    body: `Nargile boyutu hem estetik hem pratik bir tercihtir. Masaüstü modeller (60–80 cm) şişe kapasitesi sayesinde daha uzun ve stabil bir seans sunar; sabit bir oturma ortamında idealdir. Kompakt modeller (30–50 cm) az yer kaplar, taşınabilir ve temizlemesi kolaydır — balkon veya açık hava kullanımı için uygundur.

Karar kriterleri: Kullanacağınız alanın büyüklüğü, taşıyıp taşımayacağınız ve masa yüzeyi tercihiniz.`,
  },
  {
    heading: "Gövde Malzemesi: Çelik, Alüminyum, Pirinç",
    body: `Paslanmaz çelik, dayanıklılığı ve temizlenmesi kolay yüzeyiyle en uzun ömürlü seçenektir. Ağır yapısı taşıma açısından dezavantaj olabilir. Alüminyum alaşımlar hafifliği sayesinde kompakt ve taşınabilir modellerde tercih edilir; yüzey işlemine bağlı olarak anodize veya boyalı seçenekleri mevcuttur. Pirinç gövdeler geleneksel görünüm arayanlar için idealdir; zamanla doğal bir patina geliştirir.

Malzeme seçerken kaplama kalitesine, gövde kalınlığına ve contaların sızdırmazlık seviyesine dikkat edin.`,
  },
  {
    heading: "Lüle Seçimi",
    body: `Lüle, nargile seans kalitesini doğrudan etkileyen en kritik bileşendir. Seramik lüleler yavaş ısınır ve eşit ısı dağılımı sağlar; klasik çanak formları tercih edenlere uygundur. Cam lüleler ısı değişimini görsel olarak takip etmenizi sağlar. Silikon lüleler kırılmazlığıyla taşınabilir kullanımda öne çıkar.

Lüle derinliği ve delik düzeni de önemlidir: Phunnel (tek delikli) ve çok delikli tasarımlar farklı kullanım alışkanlıklarına hitap eder. Ürün sayfalarındaki teknik özellikler bölümünde bu bilgileri bulabilirsiniz.`,
  },
  {
    heading: "Şişe Türleri",
    body: `Şişe hacmi seans süresini belirler. Rusya tipi geniş tabanlı şişeler stabilite sağlar; kesme cam modeller estetik açıdan dikkat çeker. Özel formlarda üretilmiş şişeler belirli nargile gövdesi markalarıyla uyumlu tasarlanmıştır — satın almadan önce uyumluluğu kontrol edin.

Şişe materyali: Borosilikat cam, sıradan cama kıyasla ısı değişimlerine karşı daha dirençlidir ve uzun ömürlüdür.`,
  },
  {
    heading: "Marpuç ve Hortum",
    body: `Silikon marpuçlar temizlenmesi kolay ve çok uzun ömürlü yapılarıyla günümüzde standart haline gelmiştir. Boyut olarak kısa ve kompakt modeller masa üstü kullanımda pratikken, uzun marpuçlar daha rahat bir pozisyon sağlar. Çok kişilik seanslar için çift çıkışlı dağıtıcılar (splitter) uygundur.

Naimi ve buzlu modeller ek soğutma efekti sunar; bu modellerde iç boruya buz ekleyebilirsiniz.`,
  },
  {
    heading: "Bütçe Rehberi",
    body: `Başlangıç segmenti yerli veya giriş seviyesi ithal takımlardan oluşur; temel bileşenler kalitelidir ancak ek aksesuarlar gerekebilir. Orta segment çoğu kullanıcının ihtiyacını karşılar; iyi malzeme, sızdırmaz contalar ve uzun kullanım ömrü sunar. Premium segment koleksiyonluk veya yoğun kullanıcılar içindir; tasarım, malzeme ve işçilik en üst düzeydedir.

İlk alımınızda tüm parçaları içeren takım setleri değerlendirilebilir; sonradan belirli bileşenleri yükseltmek daha ekonomiktir.`,
  },
];

export default function SecimRehberiPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Rehber</p>
        <h1 className="text-4xl font-bold text-ink">Nargile Seçim Rehberi</h1>
        <p className="mt-4 text-sm text-ink-muted leading-relaxed">
          Doğru ekipmanı seçmek deneyimi doğrudan etkiler. Bu rehber boyut, malzeme, lüle ve bütçe konularında net bir çerçeve sunar.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map(({ heading, body }) => (
          <div key={heading} className="bg-bg-card border border-border-default rounded-xl p-5">
            <h2 className="font-semibold text-ink mb-3">{heading}</h2>
            {body.split("\n\n").map((para, i) => (
              <p key={i} className={`text-sm text-ink-muted leading-relaxed${i > 0 ? " mt-3" : ""}`}>
                {para}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 bg-bg-elevated border border-border-default rounded-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Koleksiyonu İnceleyin</p>
        <p className="text-sm text-ink-muted leading-relaxed">
          Rehberde bahsedilen ürün kategorilerini keşfetmek için{" "}
          <Link href="/urunler" className="text-gold underline hover:text-gold/80 transition-colors">
            ürünler sayfasını
          </Link>{" "}
          ziyaret edebilirsiniz.
        </p>
      </div>
    </div>
  );
}
