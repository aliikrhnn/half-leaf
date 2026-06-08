import type { Product } from "@/lib/types";

const BASE = "/images/nargilestore/image/cache/catalog";

export const products: Product[] = [
  // --- Nargile Setleri ---
  {
    id: "p-001",
    slug: "half-leaf-klasik-set",
    name: "Half Leaf Klasik Set",
    shortDescription:
      "Paslanmaz çelik gövde, cam hazne, silikon kamış ve aksesuar içeren eksiksiz set.",
    description:
      "Half Leaf Klasik Set; 65 cm paslanmaz çelik gövde, şeffaf cam hazne, 180 cm silikon kamış, pişmiş toprak lüle, kömür ızgarası ve maşadan oluşan eksiksiz bir başlangıç setidir. Tüm bileşenler özenle seçilmiş ve uyum içinde tasarlanmıştır.",
    price: 2499,
    compareAtPrice: 2999,
    images: [
      {
        url: `${BASE}/MOZE/moze-tradi-l-nargile-takimi-550x550.jpg`,
        alt: "Half Leaf Klasik Set",
      },
      {
        url: `${BASE}/MOZE/moze-tradi-l-nargile-takimi-2-550x550.jpg`,
        alt: "Half Leaf Klasik Set Detay",
      },
    ],
    categoryId: "cat-1",
    categorySlug: "nargile-setleri",
    tags: ["set", "başlangıç", "klasik"],
    sku: "HL-SET-001",
    stock: 15,
    isNew: false,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 24,
    specs: {
      "Gövde Yüksekliği": "65 cm",
      "Gövde Malzemesi": "Paslanmaz Çelik",
      "Hazne Tipi": "Şeffaf Cam",
      "Kamış Uzunluğu": "180 cm",
      "Lüle Tipi": "Pişmiş Toprak",
      "Set İçeriği": "Gövde, Hazne, Kamış, Lüle, Izgara, Maşa",
    },
  },
  {
    id: "p-002",
    slug: "half-leaf-modern-elit-set",
    name: "Half Leaf Modern Elit Set",
    shortDescription:
      "72 cm altın kaplama gövde, smoked cam hazne ve deri kamış içeren premium set.",
    description:
      "Half Leaf Modern Elit Set; 72 cm altın kaplama gövde, smoked cam hazne, deri saplı premium kamış, seramik lüle ve özel aksesuar setiyle üst segment bir deneyim sunar. Sofistike tasarımı ile koleksiyon değeri taşıyan bir üründür.",
    price: 3299,
    compareAtPrice: 3899,
    images: [
      {
        url: `${BASE}/HOOB/hoob-go-pro-gold-nargile-takimi-550x550.jpg`,
        alt: "Half Leaf Modern Elit Set",
      },
      {
        url: `${BASE}/HOOB/hoob-go-pro-gold-nargile-550x550.jpg`,
        alt: "Half Leaf Modern Elit Set Detay",
      },
    ],
    categoryId: "cat-1",
    categorySlug: "nargile-setleri",
    tags: ["set", "elit", "altın", "premium"],
    sku: "HL-SET-002",
    stock: 8,
    isNew: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 12,
    specs: {
      "Gövde Yüksekliği": "72 cm",
      "Gövde Malzemesi": "Altın Kaplama Çelik",
      "Hazne Tipi": "Smoked Cam",
      "Kamış Tipi": "Deri Saplı",
      "Lüle Tipi": "Seramik",
      "Set İçeriği": "Gövde, Hazne, Kamış, Lüle, Izgara, Maşa, Ağızlık Seti",
    },
  },
  {
    id: "p-003",
    slug: "half-leaf-kompakt-seyahat-seti",
    name: "Kompakt Seyahat Seti",
    shortDescription:
      "Sökülebilir gövde ve taşıma çantalı kompakt nargile seti.",
    description:
      "Seyahate uygun tasarımı ve özel taşıma çantasıyla Half Leaf Kompakt Seyahat Seti, konforlu bir taşıma deneyimi sunar. Sökülebilir paslanmaz çelik gövde, mini cam hazne ve esnek silikon kamış ile birlikte gelir.",
    price: 1699,
    images: [
      {
        url: `${BASE}/HOOB/hoob-go-mini-550x550.jpg`,
        alt: "Kompakt Seyahat Seti",
      },
      {
        url: `${BASE}/HOOB/hoob-go-mini-1-550x550.jpg`,
        alt: "Kompakt Seyahat Seti Detay",
      },
    ],
    categoryId: "cat-1",
    categorySlug: "nargile-setleri",
    tags: ["set", "seyahat", "kompakt"],
    sku: "HL-SET-003",
    stock: 20,
    isNew: true,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 8,
    specs: {
      "Gövde Yüksekliği": "45 cm (sökülebilir)",
      "Gövde Malzemesi": "Paslanmaz Çelik",
      "Hazne Tipi": "Mini Cam",
      "Kamış Uzunluğu": "150 cm",
      "Taşıma Çantası": "Dahil",
    },
  },

  // --- Cam Hazneler ---
  {
    id: "p-004",
    slug: "kristal-seffaf-hazne",
    name: "Kristal Şeffaf Hazne",
    shortDescription:
      "Optik kalite cam, geniş hacimli, tüm standart gövdelerle uyumlu hazne.",
    description:
      "Yüksek sıcaklığa dayanıklı optik cam kullanılarak üretilen bu hazne, berrak görünümü ve şık formudur. Standart 2,5 cm gövde bağlantısıyla tüm yaygın modellerle uyumludur. Taban genişliği sayesinde dengeli duruş sağlar.",
    price: 849,
    compareAtPrice: 1050,
    images: [
      {
        url: `${BASE}/Nargile-Store/quasar-yedek-cam-1-550x550.jpg`,
        alt: "Kristal Şeffaf Hazne",
      },
      {
        url: `${BASE}/Nargile-Store/quasar-yedek-cam-2-550x550.jpg`,
        alt: "Kristal Şeffaf Hazne Detay",
      },
    ],
    categoryId: "cat-2",
    categorySlug: "cam-hazneler",
    tags: ["hazne", "şeffaf", "cam"],
    sku: "HL-HAZ-001",
    stock: 30,
    isNew: false,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 41,
    specs: {
      Malzeme: "Optik Cam",
      "Bağlantı Çapı": "2,5 cm (Standart)",
      Hacim: "900 ml",
      Yükseklik: "22 cm",
      Ağırlık: "480 g",
    },
  },
  {
    id: "p-005",
    slug: "smoked-glass-hazne",
    name: "Fuji Smoked Glass Hazne",
    shortDescription:
      "Koyu tonlu dumanlı cam, yarı saydam estetik ve premium görünüm.",
    description:
      "Fuji Smoked Glass Hazne, gri tonlarda yarı opak cam yapısıyla sofistike bir görünüm sunar. Yüksek ısı direnci ve kalın cam cidarıyla uzun ömürlü kullanım için tasarlanmıştır.",
    price: 1049,
    images: [
      {
        url: `${BASE}/Samsaris/samsaris-yedek-cam-550x550.jpg`,
        alt: "Fuji Smoked Glass Hazne",
      },
      {
        url: `${BASE}/Nargile-Store/sky-line-bileziksli-sise-550x550.jpg`,
        alt: "Fuji Smoked Glass Hazne Detay",
      },
    ],
    categoryId: "cat-2",
    categorySlug: "cam-hazneler",
    tags: ["hazne", "smoked", "cam", "premium"],
    sku: "HL-HAZ-002",
    stock: 18,
    isNew: true,
    isFeatured: false,
    rating: 4.8,
    reviewCount: 17,
    specs: {
      Malzeme: "Smoked Cam",
      "Bağlantı Çapı": "2,5 cm (Standart)",
      Hacim: "850 ml",
      Yükseklik: "20 cm",
      Ağırlık: "520 g",
    },
  },
  {
    id: "p-006",
    slug: "ruby-mini-hazne",
    name: "Ruby Mini Cam Hazne",
    shortDescription:
      "Kompakt boyut, renkli cam, seyahat ve mini kullanım için ideal.",
    description:
      "Ruby Mini Hazne, canlı tonlu camıyla dikkat çekici bir estetik sunar. Kompakt boyutu sayesinde hem seyahat setleriyle hem de standart gövdelerle kullanılabilir.",
    price: 649,
    images: [
      {
        url: `${BASE}/Nargile-Store/kucuk-sise-mavi-1-550x550.jpg`,
        alt: "Ruby Mini Cam Hazne",
      },
      {
        url: `${BASE}/Nargile-Store/damla-model-sise-550x550.jpg`,
        alt: "Ruby Mini Cam Hazne Detay",
      },
    ],
    categoryId: "cat-2",
    categorySlug: "cam-hazneler",
    tags: ["hazne", "mini", "cam", "kompakt"],
    sku: "HL-HAZ-003",
    stock: 25,
    isNew: false,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 9,
    specs: {
      Malzeme: "Renkli Cam",
      "Bağlantı Çapı": "2,5 cm (Standart)",
      Hacim: "550 ml",
      Yükseklik: "16 cm",
      Ağırlık: "320 g",
    },
  },

  // --- Lüleler ---
  {
    id: "p-007",
    slug: "phunnel-pismis-toprak-lule",
    name: "Phunnel Pişmiş Toprak Lüle",
    shortDescription:
      "Geleneksel pişmiş toprak, phunnel tasarım, uzun kullanım ömrü.",
    description:
      "El yapımı pişmiş toprak phunnel lüle, ısı tutma kapasitesiyle öne çıkar. Merkezi delik tasarımı sayesinde sıvı akışını engeller. Doğal toprak malzeme, yüksek ısı dayanımı sağlar.",
    price: 479,
    compareAtPrice: 599,
    images: [
      {
        url: `${BASE}/Bee-Bowl/bee-erkek-toprak-lule-550x550.jpg`,
        alt: "Phunnel Pişmiş Toprak Lüle",
      },
      {
        url: `${BASE}/Bee-Bowl/bee-erkek-toprak-lule-2-550x550.jpg`,
        alt: "Phunnel Pişmiş Toprak Lüle Detay",
      },
    ],
    categoryId: "cat-3",
    categorySlug: "luler",
    tags: ["lüle", "phunnel", "pişmiş toprak"],
    sku: "HL-LUL-001",
    stock: 50,
    isNew: false,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 63,
    specs: {
      Malzeme: "Pişmiş Toprak",
      Tasarım: "Phunnel",
      Çap: "6,5 cm",
      Derinlik: "4 cm",
      "Uyumlu Gövde": "Standart",
    },
  },
  {
    id: "p-008",
    slug: "silikon-lule-pro",
    name: "Silikon Lüle Pro",
    shortDescription:
      "Esnek silikon, kolay temizlik, kırılmaz dayanıklılık.",
    description:
      "Gıda kalitesi silikon malzemeden üretilen bu lüle, kırılma endişesi olmadan kullanım imkânı sunar. Esnek yapısı temizliği kolaylaştırır. Tüm standart gövdelerle uyumludur.",
    price: 249,
    images: [
      {
        url: `${BASE}/Nargile-Store/quasar-silikon-lule-seti-550x550.jpg`,
        alt: "Silikon Lüle Pro",
      },
      {
        url: `${BASE}/Nargile-Store/quasar-silikon-lule-seti-1-3-550x550.jpg`,
        alt: "Silikon Lüle Pro Detay",
      },
    ],
    categoryId: "cat-3",
    categorySlug: "luler",
    tags: ["lüle", "silikon", "dayanıklı"],
    sku: "HL-LUL-002",
    stock: 80,
    isNew: false,
    isFeatured: false,
    rating: 4.4,
    reviewCount: 38,
    specs: {
      Malzeme: "Gıda Kalitesi Silikon",
      Tasarım: "Standart",
      Çap: "6 cm",
      Renk: "Siyah",
      "Uyumlu Gövde": "Standart",
    },
  },
  {
    id: "p-009",
    slug: "seramik-kaseli-lule",
    name: "Seramik Kaseli Lüle",
    shortDescription:
      "Sırlı seramik yüzey, estetik tasarım, superior ısı dağılımı.",
    description:
      "Sırlı seramik yüzeyiyle hem estetik hem de işlevsel olan bu lüle, ısıyı dengeli dağıtır. El boyaması detaylarıyla her biri özgün bir parçadır.",
    price: 349,
    images: [
      {
        url: `${BASE}/OBLAKO/oblako-solo-phunnel-550x550.jpg`,
        alt: "Seramik Kaseli Lüle",
      },
      {
        url: `${BASE}/OBLAKO/oblako-solo-phunnel-1-550x550.jpg`,
        alt: "Seramik Kaseli Lüle Detay",
      },
    ],
    categoryId: "cat-3",
    categorySlug: "luler",
    tags: ["lüle", "seramik", "el yapımı"],
    sku: "HL-LUL-003",
    stock: 35,
    isNew: true,
    isFeatured: false,
    rating: 4.7,
    reviewCount: 19,
    specs: {
      Malzeme: "Sırlı Seramik",
      Tasarım: "Klasik Kase",
      Çap: "7 cm",
      Derinlik: "3,5 cm",
      "El Yapımı": "Evet",
    },
  },

  // --- Gövdeler ---
  {
    id: "p-010",
    slug: "elite-paslanmaz-celik-govde-72cm",
    name: "Elite Paslanmaz Çelik Gövde 72 cm",
    shortDescription:
      "316L medikal paslanmaz çelik, 72 cm yükseklik, modüler tasarım.",
    description:
      "316L medikal grade paslanmaz çelikten üretilen Elite Gövde, korozyon direnci ve uzun ömrüyle öne çıkar. Modüler tasarımı, hazne ve lüle seçiminde esneklik sunar. Tüm standart aksesuarlarla uyumludur.",
    price: 1299,
    compareAtPrice: 1599,
    images: [
      {
        url: `${BASE}/STEAMULATION/steamulation-pro-x-gen-2-karbon-govde-b2a4f9-550x550.jpg`,
        alt: "Elite Paslanmaz Çelik Gövde",
      },
      {
        url: `${BASE}/MR.EDS/E25-Bodyguard---Carbon-Serisi--Limited-Edition-550x550.jpg`,
        alt: "Elite Paslanmaz Çelik Gövde Detay",
      },
    ],
    categoryId: "cat-4",
    categorySlug: "govdeler",
    tags: ["gövde", "paslanmaz çelik", "elite"],
    sku: "HL-GOV-001",
    stock: 22,
    isNew: false,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 31,
    specs: {
      Malzeme: "316L Paslanmaz Çelik",
      Yükseklik: "72 cm",
      Ağırlık: "1,4 kg",
      "Hazne Bağlantısı": "2,5 cm Standart",
      "Kamış Bağlantısı": "Standart",
      "Yüzey İşlemi": "Mat Fırçalı",
    },
  },
  {
    id: "p-011",
    slug: "gold-edition-govde-65cm",
    name: "Gold Edition Gövde 65 cm",
    shortDescription:
      "PVD altın kaplama, 65 cm, özel baskı desenli premium gövde.",
    description:
      "Fiziksel Buhar Biriktirme (PVD) yöntemiyle altın kaplanan bu gövde, çizilmeye ve solmaya karşı üstün direnç sunar. Özel lazer kazıma desenleriyle sınırlı sayıda üretilmiştir.",
    price: 1799,
    images: [
      {
        url: `${BASE}/ALPHA-HOOKAH/alpha-echo-gold-black-550x550.jpg`,
        alt: "Gold Edition Gövde",
      },
      {
        url: `${BASE}/ALPHA-HOOKAH/alpha-echo-gold-black-5-550x550.jpg`,
        alt: "Gold Edition Gövde Detay",
      },
    ],
    categoryId: "cat-4",
    categorySlug: "govdeler",
    tags: ["gövde", "altın", "premium", "pvd"],
    sku: "HL-GOV-002",
    stock: 10,
    isNew: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 7,
    specs: {
      Malzeme: "Paslanmaz Çelik + PVD Kaplama",
      Yükseklik: "65 cm",
      Ağırlık: "1,3 kg",
      "Hazne Bağlantısı": "2,5 cm Standart",
      "Yüzey İşlemi": "PVD Altın",
      "Sınırlı Üretim": "Evet",
    },
  },

  // --- Kamışlar ---
  {
    id: "p-012",
    slug: "premium-silikon-kamis-180cm",
    name: "Premium Silikon Kamış 180 cm",
    shortDescription:
      "Gıda kalitesi silikon, paslanmaz çelik spiral, kolay temizlenebilir.",
    description:
      "İç kısmı paslanmaz çelik spiral destekli, gıda kalitesi silikon kamış; bükülme olmadan rahat kullanım sağlar. 180 cm uzunluğuyla geniş alanda konfor sunar. Standart konnektörle tüm gövdelerle uyumludur.",
    price: 329,
    images: [
      {
        url: `${BASE}/Nargile-Store/bakuza-buzlu-marpuc-siyah-550x550.jpg`,
        alt: "Premium Silikon Kamış",
      },
      {
        url: `${BASE}/Nargile-Store/bakuza-buzlu-marpuc-kirmizi-550x550.jpg`,
        alt: "Premium Silikon Kamış Detay",
      },
    ],
    categoryId: "cat-5",
    categorySlug: "kamislar",
    tags: ["kamış", "silikon", "premium"],
    sku: "HL-KAM-001",
    stock: 45,
    isNew: false,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 52,
    specs: {
      Malzeme: "Gıda Kalitesi Silikon",
      Uzunluk: "180 cm",
      "İç Spiral": "Paslanmaz Çelik",
      Renk: "Siyah",
      Konnektör: "Standart Alüminyum",
    },
  },
  {
    id: "p-013",
    slug: "heritage-deri-sapli-kamis",
    name: "Heritage Deri Saplı Kamış",
    shortDescription:
      "El dikimi gerçek deri sap, silikon iç boru, vintage estetik.",
    description:
      "El dikimi gerçek deri sap ve yüksek kalite silikon iç boru kombinasyonuyla Heritage Kamış, hem estetik hem işlevselliği bir arada sunar. Vintage görünümü ile koleksiyon değeri taşır.",
    price: 529,
    compareAtPrice: 649,
    images: [
      {
        url: `${BASE}/products_2025/naimi-wonder-wood-marpuc-550x550.jpg`,
        alt: "Heritage Deri Saplı Kamış",
      },
      {
        url: `${BASE}/products_2025/naimi-wonder-wood-marpuc-kahve-550x550.jpg`,
        alt: "Heritage Deri Saplı Kamış Detay",
      },
    ],
    categoryId: "cat-5",
    categorySlug: "kamislar",
    tags: ["kamış", "deri", "vintage", "heritage"],
    sku: "HL-KAM-002",
    stock: 16,
    isNew: false,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 23,
    specs: {
      "Dış Kaplama": "Gerçek Deri (El Dikimi)",
      "İç Boru": "Gıda Kalitesi Silikon",
      Uzunluk: "175 cm",
      Konnektör: "Bronz Kaplama Alüminyum",
      "Renk Seçenekleri": "Kahverengi, Siyah",
    },
  },

  // --- Aksesuarlar ---
  {
    id: "p-014",
    slug: "komur-izgarasi-masa-seti",
    name: "Kömür Izgarası & Maşa Seti",
    shortDescription:
      "Paslanmaz çelik delikli ızgara ve ergonomik maşa, ikili set.",
    description:
      "316L paslanmaz çelikten üretilen delikli ızgara, hava sirkülasyonunu optimize eder. Ergonomik tasarımlı maşasıyla birlikte gelen set, günlük kullanım için idealdir.",
    price: 199,
    images: [
      {
        url: `${BASE}/ALPHA-HOOKAH/alpha-oro-tongs-550x550.jpg`,
        alt: "Kömür Izgarası ve Maşa Seti",
      },
      {
        url: `${BASE}/ALPHA-HOOKAH/alpha-oro-tongs-1-550x550.jpg`,
        alt: "Kömür Maşa Detay",
      },
    ],
    categoryId: "cat-6",
    categorySlug: "aksesuarlar",
    tags: ["aksesuar", "ızgara", "maşa"],
    sku: "HL-AKS-001",
    stock: 60,
    isNew: false,
    isFeatured: false,
    rating: 4.7,
    reviewCount: 88,
    specs: {
      Malzeme: "316L Paslanmaz Çelik",
      "Izgara Çapı": "25 cm",
      "Maşa Uzunluğu": "18 cm",
      "Set İçeriği": "1 Izgara + 1 Maşa",
    },
  },
  {
    id: "p-015",
    slug: "temizleme-fircasi-takimi",
    name: "Temizleme Fırçası Takımı",
    shortDescription:
      "Gövde, kamış ve lüle için 3 parça özel tasarım fırça seti.",
    description:
      "Farklı boyut ve sertlikte 3 fırçadan oluşan bu set; gövde içi, kamış ve lüle temizliği için özel olarak tasarlanmıştır. Paslanmaz çelik saplar ve doğal kıl fırçalar uzun ömürlüdür.",
    price: 89,
    images: [
      {
        url: `${BASE}/HOOB/tongs-collage-550x550.jpg`,
        alt: "Temizleme Fırçası Takımı",
      },
      {
        url: `${BASE}/HOOB/tongs-black-1-550x550.jpg`,
        alt: "Temizleme Fırçası Takımı Detay",
      },
    ],
    categoryId: "cat-6",
    categorySlug: "aksesuarlar",
    tags: ["aksesuar", "temizlik", "fırça"],
    sku: "HL-AKS-002",
    stock: 100,
    isNew: false,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 72,
    specs: {
      "Set İçeriği": "3 Adet Fırça",
      Sap: "Paslanmaz Çelik",
      "Kıl Malzemesi": "Doğal Kıl",
      "Fırça Boyutları": "Küçük, Orta, Büyük",
    },
  },
  {
    id: "p-016",
    slug: "lokum-agizlik-10lu-set",
    name: "Lokum Ağızlık 10'lu Set",
    shortDescription:
      "Tek kullanımlık hijyen ağızlık, aile ve misafir kullanımı için ideal.",
    description:
      "BPA içermeyen malzemeden üretilen bu ağızlıklar, standart kamışlarla uyumludur. Misafir kullanımında hijyen sağlar. Şeffaf kutusunda 10 adet ile gelir.",
    price: 149,
    images: [
      {
        url: `${BASE}/MOZE/amotion-calve-mouthpiece-550x550.jpg`,
        alt: "Lokum Ağızlık 10'lu Set",
      },
      {
        url: `${BASE}/MOZE/amotion-calve-mouthpiece-1_1-550x550.jpg`,
        alt: "Lokum Ağızlık Detay",
      },
    ],
    categoryId: "cat-6",
    categorySlug: "aksesuarlar",
    tags: ["aksesuar", "ağızlık", "hijyen"],
    sku: "HL-AKS-003",
    stock: 200,
    isNew: false,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 45,
    specs: {
      Malzeme: "BPA İçermez",
      Adet: "10 Adet",
      "Uyumlu Kamış": "Standart (8 mm çap)",
      Ambalaj: "Şeffaf Kutu",
    },
  },
  {
    id: "p-017",
    slug: "paslanmaz-tabak-large",
    name: "Paslanmaz Tabak (Large)",
    shortDescription:
      "316L paslanmaz çelik, 28 cm çaplı, sıçrama önleyici kenarlı tabak.",
    description:
      "Geniş 28 cm çapı ve yüksek kenar tasarımıyla bu paslanmaz çelik tabak, kömür artıklarını güvenle tutar. Silindirli kenarları sıçramaları önler. Tüm standart gövdelerle uyumludur.",
    price: 229,
    images: [
      {
        url: `${BASE}/MOZE/moze-koz-masasi-black-550x550.jpg`,
        alt: "Paslanmaz Tabak Large",
      },
      {
        url: `${BASE}/MOZE/moze-koz-masasi-black-1-550x550.jpg`,
        alt: "Paslanmaz Tabak Detay",
      },
    ],
    categoryId: "cat-6",
    categorySlug: "aksesuarlar",
    tags: ["aksesuar", "tabak", "paslanmaz"],
    sku: "HL-AKS-004",
    stock: 40,
    isNew: false,
    isFeatured: false,
    rating: 4.7,
    reviewCount: 34,
    specs: {
      Malzeme: "316L Paslanmaz Çelik",
      Çap: "28 cm",
      "Kenar Yüksekliği": "2 cm",
      "Yüzey İşlemi": "Mat Fırçalı",
    },
  },
  {
    id: "p-018",
    slug: "kalsiyum-komur-masasi",
    name: "Kalsiyum Kömür Maşası",
    shortDescription:
      "Ergonomik kavrama, 20 cm uzunluk, ısıya dayanıklı karbonlu çelik maşa.",
    description:
      "Karbonlu çelik yapısıyla yüksek ısıya dayanıklı bu maşa, ergonomik kavrama yüzeyi sayesinde güvenli kullanım sağlar. Paslanmaz uçları uzun ömürlüdür.",
    price: 119,
    images: [
      {
        url: `${BASE}/Darkside/dark-side-d-tongs-2-550x550.jpg`,
        alt: "Kalsiyum Kömür Maşası",
      },
      {
        url: `${BASE}/Darkside/dark-side-d-tongs-6-550x550.jpg`,
        alt: "Kalsiyum Kömür Maşası Detay",
      },
    ],
    categoryId: "cat-6",
    categorySlug: "aksesuarlar",
    tags: ["aksesuar", "maşa", "kömür"],
    sku: "HL-AKS-005",
    stock: 75,
    isNew: false,
    isFeatured: false,
    rating: 4.8,
    reviewCount: 56,
    specs: {
      Malzeme: "Karbonlu Çelik",
      Uzunluk: "20 cm",
      "Kavrama Yüzeyi": "Ergonomik Plastik",
      "Isı Dayanımı": "800°C",
    },
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.isFeatured);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getNewProducts(): Product[] {
  return products.filter((p) => p.isNew);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}
