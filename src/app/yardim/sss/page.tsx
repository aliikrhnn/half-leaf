import type { Metadata } from "next";
import { jsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
  description: "Half Leaf alışveriş, kargo, iade ve ürünler hakkında sık sorulan sorular ve yanıtları.",
  openGraph: { title: "Sık Sorulan Sorular | Half Leaf", description: "Alışveriş, kargo ve iade süreçlerine dair merak ettikleriniz." },
};

const faqs = [
  {
    q: "Siparişim ne zaman kargoya verilir?",
    a: "Saat 14:00'den önce verilen siparişler aynı gün, sonrakiler ertesi iş günü kargoya verilir.",
  },
  {
    q: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
    a: "Kredi/banka kartı ödemeleri PayTR güvenli ödeme altyapısı üzerinden, 256-bit SSL şifreleme ve 3D Secure ile alınır; kart bilgileriniz sitemizde saklanmaz. Ayrıca havale/EFT ile de ödeme yapabilirsiniz. Taksit seçenekleri kart tipinize göre ödeme ekranında sunulur.",
  },
  {
    q: "Ödeme bilgilerim güvende mi?",
    a: "Evet. Kart bilgileriniz doğrudan PayTR'ın PCI-DSS uyumlu güvenli ödeme ekranında girilir ve bankanızın 3D Secure doğrulamasından geçer. Kart verileriniz Half Leaf sunucularında hiçbir şekilde tutulmaz veya görülmez.",
  },
  {
    q: "Kargo ücretsiz mi?",
    a: "Belirli bir tutar ve üzeri alışverişlerde kargo ücretsizdir. Güncel koşullar ödeme sayfasında gösterilmektedir.",
  },
  {
    q: "İade ve değişim nasıl yapılır?",
    a: "Teslim tarihinden itibaren 14 gün içinde, kullanılmamış ve orijinal ambalajında ürünler için iade başlatabilirsiniz. Detaylar için İade & Değişim sayfamıza bakın.",
  },
  {
    q: "Ürünler ayıplı/kusurlu çıkarsa ne olur?",
    a: "Teslim aldığınız ürün ayıplı (kusurlu) ise, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki haklarınız saklıdır: ücretsiz onarım, ürünün ayıpsız misli ile değiştirilmesi, bedel indirimi veya sözleşmeden dönerek ödemenin iadesi. Üretici/ithalatçı garantisi bulunan ürünlerde garanti belgesi ürünle birlikte gönderilir.",
  },
  {
    q: "Siparişimi nasıl takip edebilirim?",
    a: "Kargo bildirim SMS'i ve e-posta ile gönderilen takip numarasını kargo firmasının sitesinden sorgulayabilirsiniz.",
  },
  {
    q: "Site 18 yaş sınırını nasıl uygular?",
    a: "Sitemiz 18+ yaş doğrulama zorunluluğu uygular. Siparişler yalnızca 18 yaş ve üzeri kişilere teslim edilir.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function SSSPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <script
        type="application/ld+json"
        // Zengin sonuç (FAQ rich result) için yapısal veri
        dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }}
      />
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yardım</p>
        <h1 className="text-4xl font-bold text-ink">Sık Sorulan Sorular</h1>
      </div>

      <dl className="space-y-4">
        {faqs.map(({ q, a }) => (
          <div key={q} className="bg-bg-card border border-border-default rounded-xl p-5">
            <dt className="font-medium text-ink mb-2">{q}</dt>
            <dd className="text-sm text-ink-muted leading-relaxed">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
