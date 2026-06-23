export const SITE_NAME = "Half Leaf";
export const SITE_TAGLINE = "Modern Nargile Ekipmanları";
export const SITE_DESCRIPTION =
  "Nargile takımı, lüle, cam şişe, kömür ve nargile aksesuarları — ithal ve yerli takımlar, premium markalar. Güvenli ödeme, hızlı kargo.";

export const FREE_SHIPPING_THRESHOLD = 2500;
export const SHIPPING_COST = 150;

export const CONTACT_EMAIL = "info@halfleafstore.com";
export const CONTACT_PHONE = "+90 543 533 2998";
export const CONTACT_ADDRESS = "Isparta, Türkiye";

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/halfleafstore",
  facebook: "https://facebook.com/halfleafstore",
};

export const NAV_LINKS: Array<{ label: string; href: string; megaKey?: string; accent?: boolean }> = [
  { label: "Koleksiyon", href: "/urunler", megaKey: "all" },
  { label: "Aksesuarlar", href: "/urunler?kategori=aksesuarlar", megaKey: "aksesuar" },
  { label: "Tablalar & Yedek Parçalar", href: "/urunler?kategori=tablalar", megaKey: "tabla" },
  { label: "Hediye Setleri", href: "/urunler?kategori=hediye-setleri", megaKey: "hediye" },
  { label: "İndirimli Ürünler", href: "/urunler?indirim=1", accent: true },
];

export const MEGA_MENU_DESCRIPTIONS: Record<string, string> = {
  all:              "Özenle seçilmiş pirinç ve cam koleksiyonumuzu keşfedin.",
  "nargile-takimlari": "Dünyanın en prestijli markalarından özenle seçilmiş premium koleksiyon.",
  luler:            "38 farklı marka, her seçeneğe uygun profesyonel lüle koleksiyonu.",
  siseler:          "Kesme, rus tipi ve özel tasarım şişe seçenekleri.",
  komurler:         "Kaliteli nargile kömürleri — her kullanım için doğru seçenek.",
  marpuclar:        "Buzlu, silikon ve tek kullanımlık marpuç seçenekleri.",
  aksesuarlar:      "Sipsi, çatal, folyo ve tüm sarf malzemeleri.",
  "isi-yonetimi":   "HMD cihazları, közlükler ve rüzgarlıklar — tam kontrol, eşit ısı dağılımı.",
  "koz-ocaklari":   "Elektrikli ve gazlı köz ocakları, kömür ısıtma ekipmanları.",
  "ithal-muadil":   "Orijinal yedek parçalar ve muadil aksesuar seçenekleri.",
  "aroma-mela":     "Tütünsüz, nikotinsiz bitkisel aroma ürünleri.",
};

export const FOOTER_LINKS = {
  kurumsallar: [
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "İletişim", href: "/iletisim" },
    { label: "Sık Sorulan Sorular", href: "/yardim/sss" },
  ],
  yardim: [
    { label: "Kargo & Teslimat", href: "/yardim/kargo-teslimat" },
    { label: "İade & Değişim", href: "/yardim/iade-degisim" },
    { label: "Sipariş Takibi", href: "/siparis-takip" },
  ],
  yasal: [
    { label: "KVKK", href: "/yasal/kvkk" },
    { label: "Gizlilik Politikası", href: "/yasal/gizlilik-politikasi" },
    { label: "Çerez Politikası", href: "/yasal/cerez-politikasi" },
    {
      label: "Mesafeli Satış Sözleşmesi",
      href: "/yasal/mesafeli-satis-sozlesmesi",
    },
    {
      label: "Ön Bilgilendirme Formu",
      href: "/yasal/on-bilgilendirme-formu",
    },
  ],
};
