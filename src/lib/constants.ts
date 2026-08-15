export const SITE_NAME = "Half Leaf";
export const SITE_TAGLINE = "Modern Nargile Ekipmanları";
export const SITE_DESCRIPTION =
  "Nargile takımı, lüle, cam şişe, kömür ve nargile aksesuarları — ithal ve yerli takımlar, premium markalar. Güvenli ödeme, hızlı kargo.";

export const FREE_SHIPPING_THRESHOLD = 2500;
export const SHIPPING_COST = 150;

export const CONTACT_EMAIL = "info@halfleafstore.com";
export const CONTACT_PHONE = "+90 543 533 2998";
/**
 * Mağaza adresi — yönetim panelinde ayarlanmamışsa kullanılan yedek değer.
 * İlk satır sokak/cadde, son satır şehir/ülke olacak şekilde yazılır;
 * footer ve iletişim sayfası satırları bu sırayla gösterir.
 */
export const CONTACT_ADDRESS =
  "Süleyman Demirel 102. Cadde No: 86-88/2 Dükkan 2\nIsparta, Türkiye";

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/halfleafstore",
  facebook: "https://facebook.com/halfleafstore",
};

/*
 * Not: Gezinme kategorileri ve açıklamaları veritabanından gelir
 * (app/layout.tsx → getNavCategories). Burada ayrıca sabit bir kategori
 * listesi tutulmaz; aksi hâlde iki kaynak birbirinden kayar.
 */

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
