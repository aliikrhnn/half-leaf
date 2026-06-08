import type { Category } from "@/lib/types";

export const categories: Category[] = [
  { id: "cat-1", slug: "nargile-takimlari", name: "Nargile Takımları", description: "Dünyanın en prestijli markalarından özenle seçilmiş premium koleksiyon.", image: "", productCount: 0 },
  { id: "cat-2", slug: "luler",             name: "Lüleler",           description: "38 farklı marka, her seçeneğe uygun profesyonel lüle koleksiyonu.",        image: "", productCount: 0 },
  { id: "cat-3", slug: "siseler",           name: "Şişeler",           description: "Kesme, rus tipi ve özel tasarım şişe seçenekleri.",                        image: "", productCount: 0 },
  { id: "cat-4", slug: "komurler",          name: "Kömürler",          description: "Kaliteli nargile kömürleri — her kullanım için doğru seçenek.",            image: "", productCount: 0 },
  { id: "cat-5", slug: "marpuclar",         name: "Marpuçlar",         description: "Buzlu, silikon ve tek kullanımlık marpuç seçenekleri.",                    image: "", productCount: 0 },
  { id: "cat-6", slug: "aksesuarlar",       name: "Aksesuarlar",       description: "Sipsi, çatal, folyo ve tüm sarf malzemeleri.",                            image: "", productCount: 0 },
  { id: "cat-7", slug: "isi-yonetimi",      name: "Isı Yönetimi",      description: "HMD cihazları, közlükler ve rüzgarlıklar — tam kontrol, eşit ısı dağılımı.", image: "", productCount: 0 },
  { id: "cat-8", slug: "koz-ocaklari",      name: "Köz Ocakları",      description: "Elektrikli ve gazlı köz ocakları, kömür ısıtma ekipmanları.",             image: "", productCount: 0 },
  { id: "cat-9", slug: "ithal-muadil",      name: "İthal Muadil",      description: "Orijinal yedek parçalar ve muadil aksesuar seçenekleri.",                 image: "", productCount: 0 },
  { id: "cat-10", slug: "aroma-mela",       name: "Aroma & Mela",      description: "Tütünsüz, nikotinsiz bitkisel aroma ürünleri.",                           image: "", productCount: 0 },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
