import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bakım & Temizlik Rehberi",
  description: "Nargile ekipmanlarınızın ömrünü uzatmak için adım adım bakım ve temizlik rehberi.",
  openGraph: {
    title: "Bakım & Temizlik Rehberi | Half Leaf",
    description: "Boru, lüle ve şişe temizliği için doğru teknikler.",
  },
};

const sections = [
  {
    heading: "Ne Sıklıkla Temizlemeli?",
    body: `Her seanstan sonra şişe suyunu boşaltın ve gövdenin alt kısmını çalkayın. Haftalık düzenli temizlik ise tüm bileşenlerin uzun ömürlü kalmasını sağlar. Uzun süre kullanılmayacak ekipmanlarda tam ve kuru temizlik yapıldıktan sonra saklayın.

Düzenli temizlik hem hijyen hem de ekipman performansı açısından kritik öneme sahiptir.`,
  },
  {
    heading: "Gövde Temizliği",
    body: `Gövdeyi parçalara ayırın. Tüm metal ve bağlantı parçalarını ılık su ile durulayın. İstenmeyen kalıntılar için uzun saplı bir temizleme fırçası (shaft brush) kullanın. Özellikle dönüm noktaları ve conta yerlerini dikkatlice temizleyin.

Parlak yüzeyler için ılık su yeterlidir; aşındırıcı temizlik ürünlerinden kaçının. Paslanmaz çelik yüzeyler için mikrofiber bez idealdir.`,
  },
  {
    heading: "Şişe Temizliği",
    body: `Şişeyi her seanstan sonra boşaltın ve taze su ile çalkalayın. Haftalık temizlikte şişe fırçası ile iç yüzeyi temizleyin. Kireç izi oluşmuşsa sulandırılmış beyaz sirke çözeltisini birkaç dakika bekletin, ardından iyice durulayın.

Cam şişeleri sert darbelere karşı koruyun. Borosilikat camlar ısı değişimine dayanıklı olsa da mekanik darbeye karşı dikkatli olunmalıdır.`,
  },
  {
    heading: "Lüle Temizliği",
    body: `Seramik ve cam lüleler serin suyla yavaşça yıkanmalıdır; ani sıcaklık farkı çatlağa yol açabilir. Küçük delikler için ince fırça veya kürdan kullanın. Silikon lüleler su geçirmez yapıları sayesinde en kolay temizlenen modellerdir.

Lüleyi tamamen kurutmadan saklamayın; nem içeride kalırsa yosun veya renk değişimine yol açabilir.`,
  },
  {
    heading: "Marpuç ve Hortum Temizliği",
    body: `Silikon marpuçlar içinden ılık su akıtılarak temizlenebilir. Uzun bir temizlik fırçası (hose brush) marpuç içini etkili biçimde temizler. Temizliğin ardından her iki ucunu açık bırakarak dikey konumda iyice kurutun; içinde nem kalmışsa bakteri üremesi riski doğar.

Geleneksel kumaş hortumlar suya maruz bırakılmamalıdır; bu modeller kuru yöntemlerle temizlenmelidir.`,
  },
  {
    heading: "Contalar ve Bağlantı Noktaları",
    body: `Silikon ve kauçuk contalar düzenli olarak kontrol edilmelidir. Çatlak veya deforme olmuş conta sızdırmazlığı bozar; performansı etkiler. Hafif bir su bazlı yağlayıcı contaların ömrünü uzatabilir — petrol bazlı ürünler silikon contaları bozabilir.

Vida ve bağlantı dişlerini kuru tutun. Montaj sırasında aşırı kuvvet uygulamaktan kaçının.`,
  },
  {
    heading: "Uzun Süreli Saklama",
    body: `Ekipmanı uzun süre kullanmayacaksanız tüm parçaları eksiksiz temizleyin ve tamamen kurutun. Parçaları nemden uzak, serin bir ortamda saklayın. Orijinal kutusu varsa içinde saklamak en sağlıklı yöntemdir; yoksa nefes alabilir bez kılıflar tercih edilir.

Plastik poşette sıkı sarılı şekilde saklamaktan kaçının; yoğuşma sorunlara yol açabilir.`,
  },
];

export default function BakimTemizlikPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Bakım Rehberi</p>
        <h1 className="text-4xl font-bold text-ink">Bakım &amp; Temizlik</h1>
        <p className="mt-4 text-sm text-ink-muted leading-relaxed">
          Ekipmanlarınızın ömrünü uzatmak ve performansını korumak için düzenli bakım şarttır. Adım adım rehberimizle doğru teknikler.
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
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Temizlik Ekipmanları</p>
        <p className="text-sm text-ink-muted leading-relaxed">
          Fırça setleri, conta kitleri ve aksesuarlar için{" "}
          <Link href="/urunler?kategori=aksesuarlar" className="text-gold underline hover:text-gold/80 transition-colors">
            aksesuar koleksiyonumuzu
          </Link>{" "}
          inceleyebilirsiniz.
        </p>
      </div>
    </div>
  );
}
