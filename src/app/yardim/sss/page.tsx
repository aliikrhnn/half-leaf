import type { Metadata } from "next";

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
    a: "Kredi kartı, banka kartı, havale/EFT ile ödeme yapabilirsiniz. Taksit seçenekleri kart tipinize göre değişir.",
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
    q: "Ürünlerin garantisi var mı?",
    a: "Tüm ürünler üretici garantisi kapsamındadır. Garanti süresi ürün sayfasında belirtilmektedir.",
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

export default function SSSPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
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
