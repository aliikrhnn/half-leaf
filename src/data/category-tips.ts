export const CATEGORY_TIPS: Record<string, string> = {
  "nargile-takimlari": "Modern bir takım seçerken gövde materyaline (pirinç, paslanmaz çelik) ve cam haznenin kalınlığına dikkat etmek uzun ömür sağlar. Sap ve hortum bağlantılarındaki sızdırmazlık kullanım konforunu doğrudan etkiler.",
  "luler": "Lülenin malzemesi ve ısı dağılım kapasitesi performansı belirleyen en önemli iki etkendir. Pişirim kalitesi yüksek seramik veya silikon bazlı lüleler genelde daha homojen sonuç verir.",
  "siseler": "Cam haznelerde ağız kalınlığı, taban dengesi ve sızdırmaz contaların durumu önemlidir. Yedek bir conta bulundurmak uzun vadede pratiktir.",
  "marpuclar": "Hortumun iç çapı, dış malzemesi ve yıkanabilir olup olmaması temiz kullanım açısından belirleyicidir. Silikon marpuçlar bakım kolaylığı sunarken deri kaplı modeller estetik tercihtir.",
  "aksesuarlar": "Maşa, pens, koruyucu kapak ve fırça gibi küçük aksesuarlar takımın günlük bakımını ve dayanıklılığını doğrudan etkiler. Uyumlu parça seçimi önemlidir.",
  "tablalar": "Tabla yüzeyinin pirinç, paslanmaz veya boyalı oluşu hem kullanım hem de bakım kolaylığını etkiler. Aşınan parçaların yedek ile değiştirilmesi takımın bütünlüğünü korur.",
  "isi-yonetimi": "Isı yönetim cihazları, gövdeye yerleşen lülenin üstüne konularak daha kontrollü bir ısı dağılımı sağlar. Cihaz boyutunun lüle çapıyla uyumlu olması önemlidir.",
  "koz-ocaklari": "Elektrikli veya gazlı köz ocakları seçilirken ısınma süresi ve sıcaklık ayar hassasiyeti göz önünde bulundurulmalıdır. Güvenli kullanım için düz ve sabit bir zemin tercih edin.",
  "ithal-muadil": "Yedek parça seçiminde orijinal ölçü ve montaj standartlarını kontrol etmek uyumsuzluk riskini azaltır. Gövde ile aksesuarın malzeme uyumluluğu da uzun vadeli kullanımı etkiler.",
  "aroma-mela": "Tütünsüz ve nikotinsiz bitkisel ürünlerde nem oranı ve aromayı etkileyen bileşenlerin içeriği ürün sayfasında belirtilmektedir. Farklı aroma yoğunlukları için ürün açıklamalarını inceleyin.",
};

export const CATEGORY_TIPS_FALLBACK =
  "Ürün seçiminde malzeme kalitesi, marka güvenilirliği ve kullanım amacınıza uygunluk en belirleyici kriterlerdir. Ürün sayfasındaki teknik özellikler ve görseller karşılaştırma yapmanıza yardımcı olacaktır.";

export function getCategoryTip(slug: string | undefined): string | null {
  if (!slug) return null;
  return CATEGORY_TIPS[slug] ?? CATEGORY_TIPS_FALLBACK;
}
