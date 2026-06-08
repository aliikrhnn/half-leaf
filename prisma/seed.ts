/**
 * Half Leaf — Prisma Seed
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const R3 = "/images/nargilestore/image/cache/cache/3001-4000";
const R4 = "/images/nargilestore/image/cache/cache/4001-5000";
const R5 = "/images/nargilestore/image/cache/cache/5001-6000";

type CategorySeed = {
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  parentSlug?: string;
};

const CATEGORIES: CategorySeed[] = [
  // ══ ROOT CATEGORIES (10 nav items) ══
  { slug: "nargile-takimlari", name: "Nargile Takımları",    description: "Dünyanın en prestijli markalarından özenle seçilmiş premium koleksiyon.",       imageUrl: null,  sortOrder: 1  },
  { slug: "luler",             name: "Lüleler",              description: "38 farklı marka, her seçeneğe uygun profesyonel lüle koleksiyonu.",              imageUrl: null,  sortOrder: 2  },
  { slug: "siseler",           name: "Şişeler",              description: "Kesme, rus tipi ve özel tasarım şişe seçenekleri.",                              imageUrl: null,  sortOrder: 3  },
  { slug: "komurler",          name: "Kömürler",             description: "Kaliteli nargile kömürleri – her kullanım için doğru seçenek.",                  imageUrl: null,  sortOrder: 4  },
  { slug: "marpuclar",         name: "Marpuçlar",            description: "Buzlu, silikon ve tek kullanımlık marpuç seçenekleri.",                          imageUrl: null,  sortOrder: 5  },
  { slug: "aksesuarlar",       name: "Aksesuarlar",          description: "Sipsi, çatal, folyo ve tüm sarf malzemeleri.",                                   imageUrl: null,  sortOrder: 6  },
  { slug: "isi-yonetimi",      name: "Isı Yönetimi",         description: "HMD cihazları, közlükler ve rüzgarlıklar – tam kontrol, eşit ısı dağılımı.",    imageUrl: null,  sortOrder: 7  },
  { slug: "koz-ocaklari",      name: "Köz Ocakları",         description: "Elektrikli ve gazlı köz ocakları, kömür ısıtma ekipmanları.",                    imageUrl: null,  sortOrder: 8  },
  { slug: "ithal-muadil",      name: "İthal Muadil",         description: "Orijinal yedek parçalar ve muadil aksesuar seçenekleri.",                        imageUrl: null,  sortOrder: 9  },
  { slug: "aroma-mela",        name: "Aroma & Mela",         description: "Tütünsüz, nikotinsiz bitkisel aroma ürünleri.",                                  imageUrl: null,  sortOrder: 10 },

  // ══ NARGILE TAKIMLARI — Level 2 ══
  { slug: "ithal-takimlar",    name: "İthal Takımlar", parentSlug: "nargile-takimlari", sortOrder: 1 },
  { slug: "hug-serisi",        name: "Hug Serisi",     parentSlug: "nargile-takimlari", sortOrder: 2 },
  { slug: "yerli-takimlar",    name: "Yerli Takımlar", parentSlug: "nargile-takimlari", sortOrder: 3 },
  { slug: "mr-eds-takimlar",   name: "Mr. EDS",        parentSlug: "nargile-takimlari", sortOrder: 4 },

  // ithal-takimlar — Level 3
  { slug: "tak-aeon",                  name: "Aeon",              parentSlug: "ithal-takimlar", sortOrder: 1  },
  { slug: "tak-alpha",                 name: "Alpha",             parentSlug: "ithal-takimlar", sortOrder: 2  },
  { slug: "tak-amotion-flash-bang",    name: "Amotion Flash Bang", parentSlug: "ithal-takimlar", sortOrder: 3  },
  { slug: "tak-amotion-futr",          name: "Amotion Futr",      parentSlug: "ithal-takimlar", sortOrder: 4  },
  { slug: "tak-amotion-roam",          name: "Amotion Roam",      parentSlug: "ithal-takimlar", sortOrder: 5  },
  { slug: "tak-amy-hookah",            name: "Amy Hookah",        parentSlug: "ithal-takimlar", sortOrder: 6  },
  { slug: "tak-blade",                 name: "Blade",             parentSlug: "ithal-takimlar", sortOrder: 7  },
  { slug: "tak-darkside",              name: "Darkside",          parentSlug: "ithal-takimlar", sortOrder: 8  },
  { slug: "tak-el-bomber",             name: "El Bomber",         parentSlug: "ithal-takimlar", sortOrder: 9  },
  { slug: "tak-geometry",              name: "Geometry",          parentSlug: "ithal-takimlar", sortOrder: 10 },
  { slug: "tak-honey-sigh",            name: "Honey Sigh",        parentSlug: "ithal-takimlar", sortOrder: 11 },
  { slug: "tak-mattpear",              name: "Mattpear",          parentSlug: "ithal-takimlar", sortOrder: 12 },
  { slug: "tak-maxx-royal",            name: "Maxx Royal",        parentSlug: "ithal-takimlar", sortOrder: 13 },
  { slug: "tak-mexanika-smoke",        name: "Mexanika Smoke",    parentSlug: "ithal-takimlar", sortOrder: 14 },
  { slug: "tak-moze-breeze-pro",       name: "Moze Breeze Pro",   parentSlug: "ithal-takimlar", sortOrder: 15 },
  { slug: "tak-moze-breeze-two",       name: "Moze Breeze Two",   parentSlug: "ithal-takimlar", sortOrder: 16 },
  { slug: "tak-moze-varity",           name: "Moze Varity",       parentSlug: "ithal-takimlar", sortOrder: 17 },
  { slug: "tak-nano-smoke",            name: "Nano Smoke",        parentSlug: "ithal-takimlar", sortOrder: 18 },
  { slug: "tak-quasar",                name: "Quasar",            parentSlug: "ithal-takimlar", sortOrder: 19 },
  { slug: "tak-shi-carver",            name: "Shi Carver",        parentSlug: "ithal-takimlar", sortOrder: 20 },
  { slug: "tak-steamulation-mini-gen", name: "Steamulation Mini Gen", parentSlug: "ithal-takimlar", sortOrder: 21 },

  // hug-serisi — Level 3
  { slug: "hug-galaxy-mini",  name: "Galaxy Mini",        parentSlug: "hug-serisi", sortOrder: 1 },
  { slug: "hug-galaxy-v2",    name: "Galaxy V2",          parentSlug: "hug-serisi", sortOrder: 2 },
  { slug: "hug-smart",        name: "Smart",              parentSlug: "hug-serisi", sortOrder: 3 },
  { slug: "hug-venus",        name: "Venüs",              parentSlug: "hug-serisi", sortOrder: 4 },
  { slug: "hug-elektronik",   name: "Elektronik Nargile", parentSlug: "hug-serisi", sortOrder: 5 },

  // yerli-takimlar — Level 3
  { slug: "yerli-aluminyum",  name: "Alüminyum", parentSlug: "yerli-takimlar", sortOrder: 1 },
  { slug: "yerli-catali",     name: "Çatalı",    parentSlug: "yerli-takimlar", sortOrder: 2 },
  { slug: "yerli-celik",      name: "Çelik",     parentSlug: "yerli-takimlar", sortOrder: 3 },
  { slug: "yerli-mr-wood",    name: "Mr. Wood",  parentSlug: "yerli-takimlar", sortOrder: 4 },
  { slug: "yerli-oduman",     name: "Oduman",    parentSlug: "yerli-takimlar", sortOrder: 5 },
  { slug: "yerli-pirinc",     name: "Pirinç",    parentSlug: "yerli-takimlar", sortOrder: 6 },

  // mr-eds-takimlar — Level 3
  { slug: "mre-aluminyum",    name: "Alüminyum",          parentSlug: "mr-eds-takimlar", sortOrder: 1 },
  { slug: "mre-benekli",      name: "Benekli Serisi",     parentSlug: "mr-eds-takimlar", sortOrder: 2 },
  { slug: "mre-gokkusagi",    name: "Gökkuşağı Serisi",   parentSlug: "mr-eds-takimlar", sortOrder: 3 },
  { slug: "mre-ozel-uretim",  name: "Özel Üretim Serisi", parentSlug: "mr-eds-takimlar", sortOrder: 4 },
  { slug: "mre-celik",        name: "Çelik",              parentSlug: "mr-eds-takimlar", sortOrder: 5 },

  // ══ LÜLELER — Level 2 ══
  { slug: "lule-a-h", name: "A–H", parentSlug: "luler", sortOrder: 1 },
  { slug: "lule-j-o", name: "J–O", parentSlug: "luler", sortOrder: 2 },
  { slug: "lule-q-z", name: "Q–Z", parentSlug: "luler", sortOrder: 3 },

  // lule-a-h — Level 3
  { slug: "lule-aeon-bowl",       name: "Aeon Bowl",       parentSlug: "lule-a-h", sortOrder: 1 },
  { slug: "lule-alkamik",         name: "Alkamik",         parentSlug: "lule-a-h", sortOrder: 2 },
  { slug: "lule-alpha-bowl",      name: "Alpha Bowl",      parentSlug: "lule-a-h", sortOrder: 3 },
  { slug: "lule-ath-adalya",      name: "Ath Adalya",      parentSlug: "lule-a-h", sortOrder: 4 },
  { slug: "lule-bee-bowl",        name: "Bee Bowl",        parentSlug: "lule-a-h", sortOrder: 5 },
  { slug: "lule-bee-bowl-klasik", name: "Bee Bowl Klasik", parentSlug: "lule-a-h", sortOrder: 6 },
  { slug: "lule-bee-killer",      name: "Bee Killer",      parentSlug: "lule-a-h", sortOrder: 7 },

  // lule-j-o — Level 3
  { slug: "lule-japona",         name: "Japona Hookah",   parentSlug: "lule-j-o", sortOrder: 1  },
  { slug: "lule-kolos",          name: "Kolos",           parentSlug: "lule-j-o", sortOrder: 2  },
  { slug: "lule-kong",           name: "Kong Lüle",       parentSlug: "lule-j-o", sortOrder: 3  },
  { slug: "lule-lava-razor",     name: "Lava-Razor",      parentSlug: "lule-j-o", sortOrder: 4  },
  { slug: "lule-mummy-space",    name: "Mummy Space",     parentSlug: "lule-j-o", sortOrder: 5  },
  { slug: "lule-phunnel-sub",    name: "Phunnel",         parentSlug: "lule-j-o", sortOrder: 6  },
  { slug: "lule-special-ed",     name: "Special Edition", parentSlug: "lule-j-o", sortOrder: 7  },
  { slug: "lule-turkish-boy",    name: "Turkish Boy",     parentSlug: "lule-j-o", sortOrder: 8  },
  { slug: "lule-liger-bowl",     name: "Liger Bowl",      parentSlug: "lule-j-o", sortOrder: 9  },
  { slug: "lule-max-bowl",       name: "Max Bowl",        parentSlug: "lule-j-o", sortOrder: 10 },
  { slug: "lule-mr-eds",         name: "Mr. Eds",         parentSlug: "lule-j-o", sortOrder: 11 },

  // lule-q-z — Level 3
  { slug: "lule-quasar",         name: "Quasar Lüle",        parentSlug: "lule-q-z", sortOrder: 1  },
  { slug: "lule-samsaris",       name: "Samsaris",           parentSlug: "lule-q-z", sortOrder: 2  },
  { slug: "lule-silvia",         name: "Silvia Hookah",      parentSlug: "lule-q-z", sortOrder: 3  },
  { slug: "lule-solaris",        name: "Solaris",            parentSlug: "lule-q-z", sortOrder: 4  },
  { slug: "lule-svoboda",        name: "Svoboda Bowl",       parentSlug: "lule-q-z", sortOrder: 5  },
  { slug: "lule-target",         name: "Target",             parentSlug: "lule-q-z", sortOrder: 6  },
  { slug: "lule-tuan-lux-large", name: "Tuan Lux Large",    parentSlug: "lule-q-z", sortOrder: 7  },
  { slug: "lule-tuan-lux-med",   name: "Tuan Lux Medium",   parentSlug: "lule-q-z", sortOrder: 8  },
  { slug: "lule-tuan-morning",   name: "Tuan MorningStar",  parentSlug: "lule-q-z", sortOrder: 9  },
  { slug: "lule-tuan-darkleaf",  name: "Tuan Mr. Darkleaf", parentSlug: "lule-q-z", sortOrder: 10 },
  { slug: "lule-tuan-nox",       name: "Tuan Nox",          parentSlug: "lule-q-z", sortOrder: 11 },

  // ══ ŞİŞELER — Level 2 ══
  { slug: "tum-siseler", name: "Tüm Şişeler", parentSlug: "siseler", sortOrder: 1 },

  // tum-siseler — Level 3
  { slug: "sise-hug",   name: "Hug Hookah Şişe", parentSlug: "tum-siseler", sortOrder: 1 },
  { slug: "sise-kesme", name: "Kesme Şişeler",   parentSlug: "tum-siseler", sortOrder: 2 },
  { slug: "sise-rus",   name: "Rus Tipi Şişe",   parentSlug: "tum-siseler", sortOrder: 3 },
  { slug: "sise-yedek", name: "Yedek Şişeler",   parentSlug: "tum-siseler", sortOrder: 4 },

  // ══ KÖMÜRLER — Level 2 ══
  { slug: "komur-markalari", name: "Kömür Markaları", parentSlug: "komurler", sortOrder: 1 },

  // komur-markalari — Level 3
  { slug: "komur-cocoloco",    name: "Cocoloco",    parentSlug: "komur-markalari", sortOrder: 1  },
  { slug: "komur-one-nation",  name: "One Nation",  parentSlug: "komur-markalari", sortOrder: 2  },
  { slug: "komur-black-coco",  name: "Black Coco",  parentSlug: "komur-markalari", sortOrder: 3  },
  { slug: "komur-coco-pearls", name: "Coco Pearls", parentSlug: "komur-markalari", sortOrder: 4  },
  { slug: "komur-kefo",        name: "Kefo",        parentSlug: "komur-markalari", sortOrder: 5  },
  { slug: "komur-mr-eds",      name: "Mr. EDS",     parentSlug: "komur-markalari", sortOrder: 6  },
  { slug: "komur-cocodalya",   name: "Cocodalya",   parentSlug: "komur-markalari", sortOrder: 7  },
  { slug: "komur-town-cocos",  name: "Town Coco's", parentSlug: "komur-markalari", sortOrder: 8  },
  { slug: "komur-venookah",    name: "Venookah",    parentSlug: "komur-markalari", sortOrder: 9  },
  { slug: "komur-coco-ona",    name: "Coco Ona",    parentSlug: "komur-markalari", sortOrder: 10 },
  { slug: "komur-cocoturk",    name: "CocoTürk",    parentSlug: "komur-markalari", sortOrder: 11 },
  { slug: "komur-hug-coal",    name: "Hug Coal",    parentSlug: "komur-markalari", sortOrder: 12 },

  // ══ MARPUÇLAR — Level 2 ══
  { slug: "marpuc-cesitleri", name: "Marpuçlar", parentSlug: "marpuclar", sortOrder: 1 },
  { slug: "hortum-cesitleri", name: "Hortum",    parentSlug: "marpuclar", sortOrder: 2 },

  // marpuc-cesitleri — Level 3
  { slug: "marpuc-buzlu",    name: "Buzlu Marpuçlar",  parentSlug: "marpuc-cesitleri", sortOrder: 1 },
  { slug: "marpuc-basligi",  name: "Marpuç Başlığı",   parentSlug: "marpuc-cesitleri", sortOrder: 2 },
  { slug: "marpuc-naimi",    name: "Naimi",            parentSlug: "marpuc-cesitleri", sortOrder: 3 },
  { slug: "marpuc-tek-kull", name: "Tek Kullanımlık",  parentSlug: "marpuc-cesitleri", sortOrder: 4 },

  // hortum-cesitleri — Level 3
  { slug: "hortum-plastik",    name: "Plastik Hortum",    parentSlug: "hortum-cesitleri", sortOrder: 1 },
  { slug: "hortum-silikon",    name: "Silikon Hortum",    parentSlug: "hortum-cesitleri", sortOrder: 2 },
  { slug: "hortum-soft-touch", name: "Soft Touch Hortum", parentSlug: "hortum-cesitleri", sortOrder: 3 },

  // ══ AKSESUARLAR — Level 2 ══
  { slug: "askili-sipsi", name: "Askılı Sipsi",   parentSlug: "aksesuarlar", sortOrder: 1 },
  { slug: "arac-gerec",   name: "Araç & Gereç",   parentSlug: "aksesuarlar", sortOrder: 2 },
  { slug: "tasima-diger", name: "Taşıma & Diğer", parentSlug: "aksesuarlar", sortOrder: 3 },

  // askili-sipsi — Level 3
  { slug: "sipsi-alpha",        name: "Alpha",        parentSlug: "askili-sipsi", sortOrder: 1  },
  { slug: "sipsi-ath",          name: "Ath",          parentSlug: "askili-sipsi", sortOrder: 2  },
  { slug: "sipsi-cwp",          name: "Cwp",          parentSlug: "askili-sipsi", sortOrder: 3  },
  { slug: "sipsi-darkside",     name: "Darkside",     parentSlug: "askili-sipsi", sortOrder: 4  },
  { slug: "sipsi-figurlu",      name: "Figürlü",      parentSlug: "askili-sipsi", sortOrder: 5  },
  { slug: "sipsi-hypnoss",      name: "Hypnoss",      parentSlug: "askili-sipsi", sortOrder: 6  },
  { slug: "sipsi-mattpear",     name: "Mattpear",     parentSlug: "askili-sipsi", sortOrder: 7  },
  { slug: "sipsi-moze",         name: "Moze",         parentSlug: "askili-sipsi", sortOrder: 8  },
  { slug: "sipsi-steamulation", name: "Steamulation", parentSlug: "askili-sipsi", sortOrder: 9  },
  { slug: "sipsi-taraftar",     name: "Taraftar",     parentSlug: "askili-sipsi", sortOrder: 10 },
  { slug: "sipsi-werkbund",     name: "Werkbund",     parentSlug: "askili-sipsi", sortOrder: 11 },

  // arac-gerec — Level 3
  { slug: "aks-catal-igne",   name: "Çatal ve İğne",       parentSlug: "arac-gerec", sortOrder: 1 },
  { slug: "aks-conta-suzgec", name: "Conta ve Süzgeçler",  parentSlug: "arac-gerec", sortOrder: 2 },
  { slug: "aks-kozluk-hmd",   name: "Közlük-HMD",          parentSlug: "arac-gerec", sortOrder: 3 },
  { slug: "aks-koz-masalari", name: "Köz Maşaları",         parentSlug: "arac-gerec", sortOrder: 4 },
  { slug: "aks-folyo",        name: "Nargile Folyosu",     parentSlug: "arac-gerec", sortOrder: 5 },
  { slug: "aks-ruzgarlik",    name: "Rüzgarlık",           parentSlug: "arac-gerec", sortOrder: 6 },
  { slug: "aks-sarf",         name: "Sarf Malzemeleri",    parentSlug: "arac-gerec", sortOrder: 7 },
  { slug: "aks-sipsiler",     name: "Sipsiler",            parentSlug: "arac-gerec", sortOrder: 8 },

  // tasima-diger — Level 3
  { slug: "aks-tasima-canta", name: "Taşıma Çantası", parentSlug: "tasima-diger", sortOrder: 1 },
  { slug: "aks-sise-altligi", name: "Şişe Altlığı",   parentSlug: "tasima-diger", sortOrder: 2 },
  { slug: "aks-serbetlik",    name: "Şerbetlik",       parentSlug: "tasima-diger", sortOrder: 3 },
  { slug: "aks-yedek-parca",  name: "Yedek Parçalar",  parentSlug: "tasima-diger", sortOrder: 4 },

  // ══ ISI YÖNETİMİ — Level 2 ══
  { slug: "hmd-cihazlari",    name: "HMD Cihazları",    parentSlug: "isi-yonetimi", sortOrder: 1 },
  { slug: "kozluk-ruzgarlik", name: "Közlük & Rüzgarlık", parentSlug: "isi-yonetimi", sortOrder: 2 },

  // hmd-cihazlari — Level 3
  { slug: "hmd-kaloud-lotus",  name: "Kaloud Lotus",      parentSlug: "hmd-cihazlari", sortOrder: 1 },
  { slug: "hmd-provost",       name: "Provost",           parentSlug: "hmd-cihazlari", sortOrder: 2 },
  { slug: "hmd-steamulation",  name: "Steamulation HMD",  parentSlug: "hmd-cihazlari", sortOrder: 3 },
  { slug: "hmd-ignis",         name: "Ignis",             parentSlug: "hmd-cihazlari", sortOrder: 4 },
  { slug: "hmd-razor",         name: "Razor HMD",         parentSlug: "hmd-cihazlari", sortOrder: 5 },
  { slug: "hmd-oblako-phlox",  name: "Oblako Phlox",      parentSlug: "hmd-cihazlari", sortOrder: 6 },
  { slug: "hmd-apex",          name: "Apex HMD",          parentSlug: "hmd-cihazlari", sortOrder: 7 },
  { slug: "hmd-dschinni",      name: "Dschinni",          parentSlug: "hmd-cihazlari", sortOrder: 8 },

  // kozluk-ruzgarlik — Level 3
  { slug: "kozluk-tek-parca",   name: "Tek Parça Közlük", parentSlug: "kozluk-ruzgarlik", sortOrder: 1 },
  { slug: "kozluk-coklu-delik", name: "Çoklu Delikli",   parentSlug: "kozluk-ruzgarlik", sortOrder: 2 },
  { slug: "ruzgarlik-kapali",   name: "Kapalı Rüzgarlık", parentSlug: "kozluk-ruzgarlik", sortOrder: 3 },
  { slug: "ruzgarlik-acik",     name: "Açık Rüzgarlık",   parentSlug: "kozluk-ruzgarlik", sortOrder: 4 },

  // ══ KÖZ OCAKLARI — no children ══
  // ══ İTHAL MUADİL — no children ══

  // ══ AROMA & MELA — Level 2 ══
  { slug: "aroma-urunler", name: "Ürünler", parentSlug: "aroma-mela", sortOrder: 1 },

  // aroma-urunler — Level 3
  { slug: "aroma-dark-breeze", name: "Dark Breeze",          parentSlug: "aroma-urunler", sortOrder: 1 },
  { slug: "aroma-korodo",      name: "Korodo",               parentSlug: "aroma-urunler", sortOrder: 2 },
  { slug: "aroma-supernova",   name: "Supernova Molasses",   parentSlug: "aroma-urunler", sortOrder: 3 },
  { slug: "aroma-balli-50gr",  name: "Ballı Molasses 50gr",  parentSlug: "aroma-urunler", sortOrder: 4 },
  { slug: "aroma-balli-250gr", name: "Ballı Molasses 250gr", parentSlug: "aroma-urunler", sortOrder: 5 },
  { slug: "aroma-balli-500gr", name: "Ballı Molasses 500gr", parentSlug: "aroma-urunler", sortOrder: 6 },
];

type ProductSeed = {
  slug: string; name: string; shortDescription: string; description: string;
  sku: string; basePrice: number; compareAtPrice?: number; stock: number;
  isFeatured: boolean;
  isBestseller?: boolean;
  categorySlug: string;
  images: { url: string; altText: string }[];
};

const PRODUCTS: ProductSeed[] = [
  // ── Nargile Takımları — İthal ──
  {
    slug: "honey-sigh-mini-urban-orange", name: "Honey Sigh Mini Urban SW Turuncu", sku: "HL-NAR-001",
    shortDescription: "Honey Sigh Mini Urban serisi kompakt nargile takımı, turuncu renk.", description: "Honey Sigh Mini Urban SW, kompakt boyutu ve alüminyum gövdesiyle taşınabilir kullanım için tasarlanmış bir nargile takımıdır.",
    basePrice: 1999, stock: 8, isFeatured: false, isBestseller: true, categorySlug: "tak-honey-sigh",
    images: [{ url: `${R3}/3735/main/6af8-ho-(1)-0-1-1000x1000.jpg`, altText: "Honey Sigh Mini Urban SW Turuncu" }],
  },
  // ── Honey Sigh — İthal Takımlar ──
  {
    slug: "honey-sigh-mini-urban-green", name: "Honey Sigh Mini Urban SW Yeşil", sku: "HL-NAR-002",
    shortDescription: "Honey Sigh Mini Urban serisi kompakt nargile takımı, yeşil renk.", description: "Honey Sigh Mini Urban SW, kompakt boyutu ve alüminyum gövdesiyle taşınabilir kullanım için tasarlanmış premium nargile takımıdır.",
    basePrice: 1999, stock: 6, isFeatured: false, isBestseller: true, categorySlug: "tak-honey-sigh",
    images: [{ url: `${R3}/3736/main/9138-hg-(1)-0-1-1000x1000.jpg`, altText: "Honey Sigh Mini Urban SW Yeşil" }],
  },
  {
    slug: "honey-sigh-mini-urban-pink", name: "Honey Sigh Mini Urban SW Pembe", sku: "HL-NAR-003",
    shortDescription: "Honey Sigh Mini Urban serisi kompakt nargile takımı, pembe renk.", description: "Honey Sigh Mini Urban SW, kompakt boyutu ve alüminyum gövdesiyle taşınabilir kullanım için tasarlanmış premium nargile takımıdır.",
    basePrice: 1999, stock: 5, isFeatured: false, categorySlug: "tak-honey-sigh",
    images: [{ url: `${R3}/3737/main/4e0f-hp-(1)-0-1-1000x1000.png`, altText: "Honey Sigh Mini Urban SW Pembe" }],
  },
  {
    slug: "honey-sigh-mini-urban-red", name: "Honey Sigh Mini Urban SW Kırmızı", sku: "HL-NAR-004",
    shortDescription: "Honey Sigh Mini Urban serisi kompakt nargile takımı, kırmızı renk.", description: "Honey Sigh Mini Urban SW, kompakt boyutu ve alüminyum gövdesiyle taşınabilir kullanım için tasarlanmış premium nargile takımıdır.",
    basePrice: 1999, stock: 7, isFeatured: false, categorySlug: "tak-honey-sigh",
    images: [{ url: `${R3}/3738/main/057f-hr-(1)-0-1-1000x1000.jpg`, altText: "Honey Sigh Mini Urban SW Kırmızı" }],
  },

  // ── Moze Varity — İthal Takımlar ──
  {
    slug: "moze-varity-lounge-konektor-sleeve-wavy-frosted", name: "Moze Varity Lounge Konektör Sleeve Wavy Frosted", sku: "HL-NAR-005",
    shortDescription: "Moze Varity Lounge serisi konektör sleeve, wavy frosted tasarım.", description: "Moze Varity Lounge Konektör Sleeve, Wavy Frosted cam şişe ve alüminyum gövdesiyle ergonomik tasarımı bir arada sunan premium nargile takımıdır.",
    basePrice: 3499, stock: 4, isFeatured: true, isBestseller: true, categorySlug: "tak-moze-varity",
    images: [{ url: `${R3}/3909/main/6937-Moze-Varity-Lounge-Konnekt%C3%B6r-Sleeve-Wavy-Frosted-0-1-1000x1000.jpg`, altText: "Moze Varity Lounge Konektör Sleeve Wavy Frosted" }],
  },

  // ── Moze Breeze Pro — İthal Takımlar ──
  {
    slug: "moze-breeze-pro-candy-blue-yellow", name: "Moze Breeze Pro Candy Blue Yellow", sku: "HL-NAR-006",
    shortDescription: "Moze Breeze Pro Candy serisi nargile takımı, mavi-sarı renk kombinasyonu.", description: "Moze Breeze Pro Candy Blue Yellow, paslanmaz çelik gövde ve renkli cam şişesiyle benzersiz bir estetik sunan premium nargile takımıdır.",
    basePrice: 2799, compareAtPrice: 3299, stock: 5, isFeatured: true, isBestseller: true, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4411/main/f843-Moze-Breeze-Pro-Candy-Blue-Yellow-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Candy Blue Yellow" }],
  },
  {
    slug: "moze-breeze-pro-candy-grey-white", name: "Moze Breeze Pro Candy Grey White", sku: "HL-NAR-007",
    shortDescription: "Moze Breeze Pro Candy serisi nargile takımı, gri-beyaz renk kombinasyonu.", description: "Moze Breeze Pro Candy Grey White, paslanmaz çelik gövde ve cam şişesiyle zarif bir tasarım sunan premium nargile takımıdır.",
    basePrice: 2799, stock: 6, isFeatured: false, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4412/main/3e22-Moze-Breeze-Pro-Candy-Grey-White-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Candy Grey White" }],
  },
  {
    slug: "moze-breeze-pro-candy-purple-green", name: "Moze Breeze Pro Candy Purple Green", sku: "HL-NAR-008",
    shortDescription: "Moze Breeze Pro Candy serisi nargile takımı, mor-yeşil renk kombinasyonu.", description: "Moze Breeze Pro Candy Purple Green, paslanmaz çelik gövde ve renkli cam şişesiyle dikkat çekici bir tasarım sunan premium nargile takımıdır.",
    basePrice: 2799, stock: 4, isFeatured: false, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4413/main/7fdc-Moze-Breeze-Pro-Candy-Purple-Green-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Candy Purple Green" }],
  },
  {
    slug: "moze-breeze-pro-candy-blue-purple", name: "Moze Breeze Pro Candy Blue Purple", sku: "HL-NAR-009",
    shortDescription: "Moze Breeze Pro Candy serisi nargile takımı, mavi-mor renk kombinasyonu.", description: "Moze Breeze Pro Candy Blue Purple, paslanmaz çelik gövde ve renkli cam şişesiyle özgün bir tasarım sunan premium nargile takımıdır.",
    basePrice: 2799, stock: 5, isFeatured: false, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4414/main/b221-Moze-Breeze-Pro-Candy-Blue-Purple1-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Candy Blue Purple" }],
  },
  {
    slug: "moze-breeze-pro-candy-red-purple", name: "Moze Breeze Pro Candy Red Purple", sku: "HL-NAR-010",
    shortDescription: "Moze Breeze Pro Candy serisi nargile takımı, kırmızı-mor renk kombinasyonu.", description: "Moze Breeze Pro Candy Red Purple, paslanmaz çelik gövde ve renkli cam şişesiyle cesur bir tasarım sunan premium nargile takımıdır.",
    basePrice: 2799, stock: 6, isFeatured: false, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4415/main/5d33-Moze-Breeze-Pro-Candy-Red-Purple-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Candy Red Purple" }],
  },
  {
    slug: "moze-breeze-pro-wavy-frosted", name: "Moze Breeze Pro Wavy Frosted", sku: "HL-NAR-011",
    shortDescription: "Moze Breeze Pro Wavy serisi nargile takımı, buzlu mat cam şişe.", description: "Moze Breeze Pro Wavy Frosted, mat buzlu cam şişesi ve alüminyum gövdesiyle şık ve minimal tasarım sunan premium nargile takımıdır.",
    basePrice: 2899, stock: 7, isFeatured: false, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4416/main/4203-Moze-Breeze-Pro-Wavy-Frosted-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Wavy Frosted" }],
  },
  {
    slug: "moze-breeze-pro-wavy-blue", name: "Moze Breeze Pro Wavy Blue", sku: "HL-NAR-012",
    shortDescription: "Moze Breeze Pro Wavy serisi nargile takımı, mavi renk.", description: "Moze Breeze Pro Wavy Blue, mavi renkli cam şişesi ve alüminyum gövdesiyle özgün tasarım sunan premium nargile takımıdır.",
    basePrice: 2899, stock: 5, isFeatured: false, categorySlug: "tak-moze-breeze-pro",
    images: [{ url: `${R4}/4418/main/f1df-Moze-Breeze-Pro-Wavy-Blue-0-1-1000x1000.jpg`, altText: "Moze Breeze Pro Wavy Blue" }],
  },
  {
    slug: "moze-breeze-two-wavy-purple", name: "Moze Breeze Two Wavy Purple", sku: "HL-NAR-013",
    shortDescription: "Moze Breeze Two serisi nargile takımı, mor wavy cam şişe.", description: "Moze Breeze Two Wavy Purple, mor renkli wavy cam şişesi ve paslanmaz çelik gövdesiyle öne çıkan premium nargile takımıdır.",
    basePrice: 3199, stock: 4, isFeatured: false, categorySlug: "tak-moze-breeze-two",
    images: [{ url: `${R4}/4813/main/cfa6-moze-breeze-two-wavy-purple-1-0-1-1000x1000.jpg`, altText: "Moze Breeze Two Wavy Purple" }],
  },

  // ── Amotion Futr — İthal Takımlar ──
  {
    slug: "amotion-futr-lime", name: "Amotion Futr Lime", sku: "HL-NAR-014",
    shortDescription: "Amotion Futr serisi nargile takımı, lime renk.", description: "Amotion Futr Lime, ince alüminyum gövdesi ve titanyum kaplama detaylarıyla premium nargile deneyimi sunan bir takımdır.",
    basePrice: 3299, stock: 5, isFeatured: false, categorySlug: "tak-amotion-futr",
    images: [{ url: `${R4}/4422/main/f8a1-Amotion-Futr-Lime-0-1-1000x1000.jpg`, altText: "Amotion Futr Lime" }],
  },
  {
    slug: "amotion-futr-mauve", name: "Amotion Futr Mauve", sku: "HL-NAR-015",
    shortDescription: "Amotion Futr serisi nargile takımı, mauve renk.", description: "Amotion Futr Mauve, ince alüminyum gövdesi ve zarif mauve rengiyle şık bir nargile deneyimi sunan premium takımdır.",
    basePrice: 3299, stock: 4, isFeatured: false, categorySlug: "tak-amotion-futr",
    images: [{ url: `${R4}/4423/main/7c77-Amotion-Futr-Mauve-0-1-1000x1000.png`, altText: "Amotion Futr Mauve" }],
  },
  {
    slug: "amotion-futr-sky", name: "Amotion Futr Sky", sku: "HL-NAR-016",
    shortDescription: "Amotion Futr serisi nargile takımı, sky (gökyüzü mavisi) renk.", description: "Amotion Futr Sky, gökyüzü mavisi rengi ve ince alüminyum gövdesiyle premium nargile deneyimi sunan şık bir takımdır.",
    basePrice: 3299, stock: 6, isFeatured: true, categorySlug: "tak-amotion-futr",
    images: [{ url: `${R4}/4424/main/7295-Amotion-Futr-Sky-0-1-1000x1000.jpg`, altText: "Amotion Futr Sky" }],
  },
  {
    slug: "amotion-futr-stone", name: "Amotion Futr Stone", sku: "HL-NAR-017",
    shortDescription: "Amotion Futr serisi nargile takımı, stone (taş gri) renk.", description: "Amotion Futr Stone, taş gri rengi ve ince alüminyum gövdesiyle sade şıklık sunan premium nargile takımıdır.",
    basePrice: 3299, stock: 5, isFeatured: false, categorySlug: "tak-amotion-futr",
    images: [{ url: `${R4}/4425/main/c216-Amotion-Futr-Stone-0-1-1000x1000.jpg`, altText: "Amotion Futr Stone" }],
  },

  // ── Amotion Roam — İthal Takımlar ──
  {
    slug: "amotion-roam-asher", name: "Amotion Roam Asher", sku: "HL-NAR-018",
    shortDescription: "Amotion Roam serisi nargile takımı, Asher renk.", description: "Amotion Roam Asher, geniş seyahat çantasıyla birlikte gelen ve her ortama uyum sağlayan premium nargile takımıdır.",
    basePrice: 3499, stock: 5, isFeatured: false, categorySlug: "tak-amotion-roam",
    images: [{ url: `${R4}/4426/main/8075-Amotion-Roam-Asher-0-1-1000x1000.jpg`, altText: "Amotion Roam Asher" }],
  },
  {
    slug: "amotion-roam-cobalt", name: "Amotion Roam Cobalt", sku: "HL-NAR-019",
    shortDescription: "Amotion Roam serisi nargile takımı, kobalt mavi renk.", description: "Amotion Roam Cobalt, kobalt mavi rengi ve taşıma çantasıyla birlikte gelen premium nargile takımıdır.",
    basePrice: 3499, stock: 4, isFeatured: false, categorySlug: "tak-amotion-roam",
    images: [{ url: `${R4}/4427/main/ec9f-Amotion-Roam-Cobalt-0-1-1000x1000.jpg`, altText: "Amotion Roam Cobalt" }],
  },

  // ── Amotion Flash Bang — İthal Takımlar ──
  {
    slug: "amotion-flash-bang-amber", name: "Amotion Flash Bang Amber", sku: "HL-NAR-020",
    shortDescription: "Amotion Flash Bang serisi nargile takımı, amber renk.", description: "Amotion Flash Bang Amber, kompakt yapısı ve amber renkli cam şişesiyle şık ve işlevsel bir nargile takımıdır.",
    basePrice: 3799, stock: 5, isFeatured: false, categorySlug: "tak-amotion-flash-bang",
    images: [{ url: `${R4}/4436/main/3b39-Amotion-Flash-Bang-Amber-0-1-1000x1000.jpg`, altText: "Amotion Flash Bang Amber" }],
  },
  {
    slug: "amotion-flash-bang-arctic", name: "Amotion Flash Bang Arctic", sku: "HL-NAR-021",
    shortDescription: "Amotion Flash Bang serisi nargile takımı, arctic renk.", description: "Amotion Flash Bang Arctic, soğuk arctic tonlarında renklendirilmiş şişesiyle dikkat çekici premium nargile takımıdır.",
    basePrice: 3799, stock: 6, isFeatured: true, categorySlug: "tak-amotion-flash-bang",
    images: [{ url: `${R4}/4437/main/a867-Amotion-Flash-Bang-Arctic-0-1-1000x1000.jpg`, altText: "Amotion Flash Bang Arctic" }],
  },
  {
    slug: "amotion-flash-bang-orchid", name: "Amotion Flash Bang Orchid", sku: "HL-NAR-022",
    shortDescription: "Amotion Flash Bang serisi nargile takımı, orkide rengi.", description: "Amotion Flash Bang Orchid, orkide tonlarında şişesiyle zarif ve sofistike bir görünüm sunan premium nargile takımıdır.",
    basePrice: 3799, stock: 4, isFeatured: false, categorySlug: "tak-amotion-flash-bang",
    images: [{ url: `${R4}/4438/main/4bd6-Amotion-Flash-Bang-Orchid-0-1-1000x1000.jpg`, altText: "Amotion Flash Bang Orchid" }],
  },
  {
    slug: "amotion-flash-bang-teal", name: "Amotion Flash Bang Teal", sku: "HL-NAR-023",
    shortDescription: "Amotion Flash Bang serisi nargile takımı, teal renk.", description: "Amotion Flash Bang Teal, teal yeşili rengindeki cam şişesiyle göz alıcı bir nargile takımıdır.",
    basePrice: 3799, stock: 5, isFeatured: false, categorySlug: "tak-amotion-flash-bang",
    images: [{ url: `${R4}/4439/main/c99f-Amotion-Flash-Bang-Teal-0-1-1000x1000.jpg`, altText: "Amotion Flash Bang Teal" }],
  },
  {
    slug: "amotion-flash-bang-teal-mor", name: "Amotion Flash Bang Teal Mor", sku: "HL-NAR-024",
    shortDescription: "Amotion Flash Bang serisi nargile takımı, teal-mor renk kombinasyonu.", description: "Amotion Flash Bang Teal Mor, iki rengin buluştuğu eşsiz cam şişesiyle premium nargile deneyimi sunan bir takımdır.",
    basePrice: 3999, stock: 4, isFeatured: false, categorySlug: "tak-amotion-flash-bang",
    images: [{ url: `${R4}/4602/main/6376-amotion-flash-bang-teal_mor-0-1-1000x1000.jpg`, altText: "Amotion Flash Bang Teal Mor" }],
  },

  // ── Alpha — İthal Takımlar ──
  {
    slug: "alpha-hookah-red", name: "Alpha Hookah Red", sku: "HL-NAR-025",
    shortDescription: "Alpha Hookah serisi nargile takımı, kırmızı renk.", description: "Alpha Hookah Red, kompakt alüminyum gövdesi ve kırmızı rengiyle dikkat çekici bir nargile takımıdır.",
    basePrice: 2499, stock: 8, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R4}/4212/main/fef9-alpha%20red-0-1-1000x1000.jpeg`, altText: "Alpha Hookah Red" }],
  },
  {
    slug: "alpha-hookah-neon", name: "Alpha Hookah Neon", sku: "HL-NAR-026",
    shortDescription: "Alpha Hookah Neon serisi nargile takımı, neon renk.", description: "Alpha Hookah Neon, özel neon renk uygulamasıyla gece atmosferine uygun şık bir nargile takımıdır.",
    basePrice: 2799, compareAtPrice: 3299, stock: 5, isFeatured: true, categorySlug: "tak-alpha",
    images: [
      { url: `${R4}/4375/main/2a49-alpha-neon-hookah-1-0-1-1000x1000.jpg`, altText: "Alpha Hookah Neon" },
      { url: `${R4}/4375/additional/5bd7-alpha-neon-hookah-0-1-1000x1000.jpg`, altText: "Alpha Hookah Neon Detay" },
    ],
  },
  {
    slug: "alpha-hookah-s-black-matte", name: "Alpha Hookah S Mat Siyah", sku: "HL-NAR-027",
    shortDescription: "Alpha Hookah S serisi nargile takımı, mat siyah renk.", description: "Alpha Hookah S Mat Siyah, ince ve şık tasarımıyla öne çıkan premium bir nargile takımıdır.",
    basePrice: 2699, stock: 6, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R4}/4612/main/88ca-alpha-s-0-1-1000x1000.jpg`, altText: "Alpha Hookah S Mat Siyah" }],
  },
  {
    slug: "alpha-hookah-oro-prime", name: "Alpha Hookah Oro Prime", sku: "HL-NAR-028",
    shortDescription: "Alpha Hookah Oro Prime serisi nargile takımı, altın detaylı.", description: "Alpha Hookah Oro Prime, altın kaplama detayları ve premium malzeme kalitesiyle lüks nargile deneyimi sunan bir takımdır.",
    basePrice: 3499, compareAtPrice: 3999, stock: 4, isFeatured: true, categorySlug: "tak-alpha",
    images: [
      { url: `${R4}/4882/main/237d-alpho-oro-prime-0-1-1000x1000.jpg`, altText: "Alpha Hookah Oro Prime" },
      { url: `${R4}/4882/additional/6d49-alpha-oro-nargile-store-1-0-1-1000x1000.jpg`, altText: "Alpha Hookah Oro Prime Detay" },
    ],
  },
  {
    slug: "alpha-hookah-beat-splash", name: "Alpha Hookah Beat Splash", sku: "HL-NAR-029",
    shortDescription: "Alpha Hookah Beat Splash serisi nargile takımı, renkli splash tasarım.", description: "Alpha Hookah Beat Splash, canlı renkli gövdesi ve modern tasarımıyla dikkat çekici premium nargile takımıdır.",
    basePrice: 2899, stock: 5, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R4}/4982/main/cfdb-alpha-beat-splash-2-0-1-1000x1000.jpg`, altText: "Alpha Hookah Beat Splash" }],
  },
  {
    slug: "alpha-hookah-smart-ekzo", name: "Alpha Hookah Smart Ekzo", sku: "HL-NAR-030",
    shortDescription: "Alpha Hookah Smart Ekzo serisi nargile takımı.", description: "Alpha Hookah Smart Ekzo, akıllı hava akışı sistemi ve premium malzemeleriyle üst segment nargile deneyimi sunan bir takımdır.",
    basePrice: 3299, stock: 5, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R4}/4967/main/65d5-alpha-hookah-smart-ekzo-2276-4-0-1-1000x1000.jpg`, altText: "Alpha Hookah Smart Ekzo" }],
  },
  {
    slug: "alpha-model-x-cosmo", name: "Alpha Model X Cosmo", sku: "HL-NAR-031",
    shortDescription: "Alpha Model X Cosmo serisi nargile takımı.", description: "Alpha Model X Cosmo, geniş cosmo lülesiyle birlikte gelen ve premium malzeme kalitesiyle öne çıkan nargile takımıdır.",
    basePrice: 3199, stock: 4, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R5}/5050/main/10bb-alpha-model-x-cosmo-0-1-1000x1000.jpg`, altText: "Alpha Model X Cosmo" }],
  },
  {
    slug: "alpha-hookah-midnight-candy", name: "Alpha Hookah Midnight Candy", sku: "HL-NAR-032",
    shortDescription: "Alpha Hookah Midnight Candy serisi nargile takımı.", description: "Alpha Hookah Midnight Candy, gece mavisi candy rengiyle göz alıcı premium nargile takımıdır.",
    basePrice: 2999, stock: 5, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R5}/5052/main/0cf5-alpha-hookah-midnight-candy-0-1-1000x1000.jpg`, altText: "Alpha Hookah Midnight Candy" }],
  },

  // ── Blade — İthal Takımlar ──
  {
    slug: "blade-hookah-black", name: "Blade Hookah Siyah", sku: "HL-NAR-033",
    shortDescription: "Blade Hookah nargile takımı, mat siyah renk.", description: "Blade Hookah Siyah, keskin tasarımı ve mat siyah kaplamasıyla sade ama güçlü bir nargile takımıdır.",
    basePrice: 2599, stock: 7, isFeatured: false, categorySlug: "tak-blade",
    images: [{ url: `${R4}/4216/main/0e36-blade-black-0-1-1000x1000.jpg`, altText: "Blade Hookah Siyah" }],
  },
  {
    slug: "blade-hookah-gold", name: "Blade Hookah Altın", sku: "HL-NAR-034",
    shortDescription: "Blade Hookah nargile takımı, altın renk.", description: "Blade Hookah Altın, altın kaplama detayları ve şık tasarımıyla lüks bir nargile takımıdır.",
    basePrice: 2699, stock: 5, isFeatured: false, categorySlug: "tak-blade",
    images: [{ url: `${R4}/4217/main/3c87-blade-gold-0-1-1000x1000.jpg`, altText: "Blade Hookah Altın" }],
  },
  {
    slug: "blade-hookah-grey", name: "Blade Hookah Gri", sku: "HL-NAR-035",
    shortDescription: "Blade Hookah nargile takımı, gri renk.", description: "Blade Hookah Gri, şık gri tasarımı ve premium malzemeleriyle değer sunan nargile takımıdır.",
    basePrice: 2599, stock: 6, isFeatured: false, categorySlug: "tak-blade",
    images: [{ url: `${R4}/4218/main/15d2-blade-grey-0-1-1000x1000.jpg`, altText: "Blade Hookah Gri" }],
  },
  {
    slug: "blade-hookah-red", name: "Blade Hookah Kırmızı", sku: "HL-NAR-036",
    shortDescription: "Blade Hookah nargile takımı, kırmızı renk.", description: "Blade Hookah Kırmızı, canlı kırmızı rengi ve keskin tasarımıyla öne çıkan nargile takımıdır.",
    basePrice: 2599, stock: 5, isFeatured: false, categorySlug: "tak-blade",
    images: [{ url: `${R4}/4219/main/fabd-blade-red-0-1-1000x1000.jpg`, altText: "Blade Hookah Kırmızı" }],
  },
  {
    slug: "blade-hookah-purple", name: "Blade Hookah Mor", sku: "HL-NAR-037",
    shortDescription: "Blade Hookah nargile takımı, mor renk.", description: "Blade Hookah Mor, zarif mor rengi ve modern tasarımıyla sofistike bir nargile takımıdır.",
    basePrice: 2599, stock: 4, isFeatured: false, categorySlug: "tak-blade",
    images: [{ url: `${R4}/4220/main/6049-blade-mor-0-1-1000x1000.jpg`, altText: "Blade Hookah Mor" }],
  },

  // ── El Bomber — İthal Takımlar ──
  {
    slug: "el-bomber-igla-aztec", name: "El Bomber Igla Aztec Nargile Takımı", sku: "HL-NAR-038",
    shortDescription: "El Bomber Igla Aztec nargile takımı, Aztec desen.", description: "El Bomber Igla Aztec, Aztec deseni ilhamlı ünik gövdesiyle kültürel ve estetik değerini ön plana çıkaran premium nargile takımıdır.",
    basePrice: 3999, compareAtPrice: 4699, stock: 3, isFeatured: true, categorySlug: "tak-el-bomber",
    images: [{ url: `${R4}/4951/main/24e3-el-bomber-igla-aztec-nargile-takimi-b-ad9e-0-1-1000x1000.jpg`, altText: "El Bomber Igla Aztec" }],
  },

  // ── Darkside — İthal Takımlar ──
  {
    slug: "darkside-d-stick", name: "Darkside D-Stick Nargile Takımı", sku: "HL-NAR-039",
    shortDescription: "Darkside D-Stick nargile takımı, kompakt ve modern tasarım.", description: "Darkside D-Stick, kompakt gövde tasarımı ve modern çizgileriyle pratik bir nargile deneyimi sunan premium takımdır.",
    basePrice: 2899, stock: 6, isFeatured: false, categorySlug: "tak-darkside",
    images: [{ url: `${R4}/4972/main/b92a-dark-side-d-stick-1-0-1-1000x1000.jpg`, altText: "Darkside D-Stick" }],
  },
  {
    slug: "darkside-d-stick-base", name: "Darkside D-Stick Base Nargile Takımı", sku: "HL-NAR-040",
    shortDescription: "Darkside D-Stick Base nargile takımı, geniş tabanlı tasarım.", description: "Darkside D-Stick Base, geniş tabanlı cam şişesi ve premium malzemeleriyle dengeli ve şık bir nargile takımıdır.",
    basePrice: 3199, stock: 5, isFeatured: false, categorySlug: "tak-darkside",
    images: [{ url: `${R4}/4973/main/8d6c-d-stick-base-dark-side-0-1-1000x1000.jpg`, altText: "Darkside D-Stick Base" }],
  },
  {
    slug: "darkside-d-stick-bronze", name: "Darkside D-Stick Bronze Nargile Takımı", sku: "HL-NAR-041",
    shortDescription: "Darkside D-Stick Bronze nargile takımı, bronz renk.", description: "Darkside D-Stick Bronze, bronz kaplama detaylarıyla lüks görünüm sunan premium nargile takımıdır.",
    basePrice: 3399, stock: 4, isFeatured: false, categorySlug: "tak-darkside",
    images: [{ url: `${R5}/5044/main/bd34-dark-side-d-stick-bronze-0-1-1000x1000.jpg`, altText: "Darkside D-Stick Bronze" }],
  },

  // ── Hoob — İthal Takımlar ──
  {
    slug: "hoob-atom-siena-orange-gold", name: "Hoob Atom Siena Orange Gold", sku: "HL-NAR-042",
    shortDescription: "Hoob Atom serisi nargile takımı, Siena turuncu-altın renk.", description: "Hoob Atom Siena Orange Gold, turuncu ve altın renk kombinasyonu ve kompakt yapısıyla özgün bir nargile takımıdır.",
    basePrice: 3499, stock: 5, isFeatured: false, categorySlug: "tak-aeon",
    images: [
      { url: `${R4}/4984/main/b7c4-hoob-atom-siena-orange-gold-2-ed71-0-1-1000x1000.jpg`, altText: "Hoob Atom Siena Orange Gold" },
      { url: `${R4}/4984/additional/d146-hoob-atom-space-grey-0-1-1000x1000.jpg`, altText: "Hoob Atom Space Grey" },
    ],
  },
  {
    slug: "hoob-sub-atom-black-gold", name: "Hoob Sub Atom Black Gold", sku: "HL-NAR-043",
    shortDescription: "Hoob Sub Atom nargile takımı, siyah-altın renk kombinasyonu.", description: "Hoob Sub Atom Black Gold, siyah ve altın renk kombinasyonu ve modern tasarımıyla premium nargile deneyimi sunan takımdır.",
    basePrice: 3699, stock: 4, isFeatured: false, categorySlug: "tak-aeon",
    images: [
      { url: `${R5}/5031/main/cae6-hoob-sub-atom-black-gold-0-1-1000x1000.jpg`, altText: "Hoob Sub Atom Black Gold" },
      { url: `${R5}/5031/additional/6f9e-hoob-sub-atom-vine-gold-0-1-1000x1000.jpg`, altText: "Hoob Sub Atom Vine Gold" },
    ],
  },

  // ── Flow Lüle — İthal ──
  {
    slug: "flow-hookah-lule", name: "Flow Hookah Lüle", sku: "HL-NAR-044",
    shortDescription: "Flow Hookah serisi modern tasarımlı nargile.", description: "Flow Hookah, akış odaklı yenilikçi tasarımı ve premium seramik lülesiyle üst segment nargile deneyimi sunan bir takımdır.",
    basePrice: 2899, stock: 5, isFeatured: false, categorySlug: "tak-amotion-flash-bang",
    images: [{ url: `${R4}/4607/main/4aa8-flow1-0-1-1000x1000.jpg`, altText: "Flow Hookah" }],
  },

  // ── Union — İthal Takımlar ──
  {
    slug: "union-hookah-argument", name: "Union Hookah Argument", sku: "HL-NAR-045",
    shortDescription: "Union Hookah Argument serisi nargile takımı.", description: "Union Hookah Argument, etkileyici tasarımı ve kaliteli malzemeleriyle premium nargile deneyimi sunan bir takımdır.",
    basePrice: 3799, stock: 4, isFeatured: false, categorySlug: "tak-aeon",
    images: [
      { url: `${R4}/4642/main/9a51-union-hookah-argument_5000x-0-1-1000x1000.jpg`, altText: "Union Hookah Argument" },
      { url: `${R4}/4642/additional/0f7e-union-argument-0-1-1000x1000.jpg`, altText: "Union Hookah Argument Detay" },
    ],
  },

  // ── Mattpear — İthal Takımlar ──
  {
    slug: "mattpear-hookah", name: "Mattpear Nargile Takımı", sku: "HL-NAR-046",
    shortDescription: "Mattpear serisi nargile takımı, mat kaplama.", description: "Mattpear Nargile, mat dokunuşlu kaplama ve özgün alüminyum gövdesiyle premium kalite sunan bir nargile takımıdır.",
    basePrice: 2999, stock: 5, isFeatured: false, categorySlug: "tak-mattpear",
    images: [{ url: `${R4}/4646/main/6b4a-ms1-0-1-1000x1000.jpg`, altText: "Mattpear Nargile Takımı" }],
  },

  // ── Amy Hookah — İthal Takımlar ──
  {
    slug: "amy-hookah-deluxe", name: "Amy Hookah Deluxe Nargile Takımı", sku: "HL-NAR-047",
    shortDescription: "Amy Hookah Deluxe serisi nargile takımı.", description: "Amy Hookah Deluxe, Alman tasarımı ve yüksek kaliteli malzemeleriyle öne çıkan premium nargile takımıdır.",
    basePrice: 3299, stock: 4, isFeatured: false, categorySlug: "tak-amy-hookah",
    images: [{ url: `${R4}/4644/main/2601-amydell-0-1-1000x1000.jpg`, altText: "Amy Hookah Deluxe" }],
  },

  // ── Hug Serisi — Hug Mini ──
  {
    slug: "hug-mini-beyaz", name: "Hug Mini Beyaz", sku: "HL-HUG-001",
    shortDescription: "Hug Mini serisi nargile takımı, beyaz renk.", description: "Hug Mini Beyaz, kompakt boyutu ve beyaz cam şişesiyle zarif ve şık bir nargile takımıdır.",
    basePrice: 1799, stock: 8, isFeatured: false, categorySlug: "hug-smart",
    images: [
      { url: `${R4}/4184/main/3cea-hug-mini-beyaz-0-1-1000x1000.jpg`, altText: "Hug Mini Beyaz" },
      { url: `${R4}/4184/additional/fcea-hug-beyaz-mini1-0-1-1000x1000.jpg`, altText: "Hug Mini Beyaz Detay" },
    ],
  },
  {
    slug: "hug-mini-siyah", name: "Hug Mini Siyah", sku: "HL-HUG-002",
    shortDescription: "Hug Mini serisi nargile takımı, siyah renk.", description: "Hug Mini Siyah, kompakt boyutu ve siyah cam şişesiyle modern ve şık bir nargile takımıdır.",
    basePrice: 1799, stock: 7, isFeatured: false, categorySlug: "hug-smart",
    images: [
      { url: `${R4}/4185/main/b412-hug-siyah-mini-0-1-1000x1000.jpg`, altText: "Hug Mini Siyah" },
      { url: `${R4}/4185/additional/5454-hug-siyah-mini1-0-1-1000x1000.jpg`, altText: "Hug Mini Siyah Detay" },
    ],
  },
  {
    slug: "hug-mini-yesil", name: "Hug Mini Yeşil", sku: "HL-HUG-003",
    shortDescription: "Hug Mini serisi nargile takımı, yeşil renk.", description: "Hug Mini Yeşil, kompakt boyutu ve yeşil cam şişesiyle doğal ve ferah bir nargile takımıdır.",
    basePrice: 1799, stock: 6, isFeatured: false, categorySlug: "hug-smart",
    images: [
      { url: `${R4}/4186/main/5645-hug-ye%C5%9Fil-mini-0-1-1000x1000.jpg`, altText: "Hug Mini Yeşil" },
      { url: `${R4}/4186/additional/060c-hug-ye%C5%9Fil-mini3-0-1-1000x1000.jpg`, altText: "Hug Mini Yeşil Detay" },
    ],
  },

  // ── Hug Venus ──
  {
    slug: "hug-venus", name: "Hug Venüs", sku: "HL-HUG-004",
    shortDescription: "Hug Venüs serisi nargile takımı.", description: "Hug Venüs, zarif şişe formlu tasarımı ve premium cam malzemeyle şık bir nargile takımıdır.",
    basePrice: 2199, stock: 5, isFeatured: false, categorySlug: "hug-venus",
    images: [
      { url: `${R4}/4593/main/d2b2-ven%C3%BCs01-0-1-1000x1000.jpg`, altText: "Hug Venüs" },
      { url: `${R4}/4593/additional/29e1-ven%C3%BCs11-0-1-1000x1000.jpg`, altText: "Hug Venüs Detay" },
    ],
  },
  {
    slug: "hug-venus-gold", name: "Hug Venüs Gold", sku: "HL-HUG-005",
    shortDescription: "Hug Venüs Gold serisi nargile takımı, altın detaylar.", description: "Hug Venüs Gold, altın renk detayları ve zarif şişe formuyla lüks bir nargile deneyimi sunan takımdır.",
    basePrice: 2499, stock: 4, isFeatured: false, categorySlug: "hug-venus",
    images: [
      { url: `${R4}/4594/main/fd46-gold1-0-1-1000x1000.jpg`, altText: "Hug Venüs Gold" },
      { url: `${R4}/4594/additional/00e7-gold7-0-1-1000x1000.jpg`, altText: "Hug Venüs Gold Detay" },
    ],
  },

  // ── Alpha Smart Exzo Tribal ──
  {
    slug: "alpha-smart-exzo-tribal-green", name: "Alpha Smart Exzo Tribal Green", sku: "HL-HUG-006",
    shortDescription: "Alpha Smart Exzo Tribal serisi, yeşil tribal desen.", description: "Alpha Smart Exzo Tribal Green, tribal desen ilhamlı yeşil renk gövdesi ve akıllı hava akışı sistemiyle öne çıkan premium nargile takımıdır.",
    basePrice: 3599, stock: 4, isFeatured: false, categorySlug: "tak-alpha",
    images: [{ url: `${R5}/5032/main/5e99-SMART-EXZO-TRIBAL-GREEN-FRONT-0-1-1000x1000.jpg`, altText: "Alpha Smart Exzo Tribal Green" }],
  },

  // ── Şişeler ──
  {
    slug: "rus-tipi-mini-seffaf-sise", name: "Rus Tipi Mini Şeffaf Şişe", sku: "HL-SIS-001",
    shortDescription: "Rus tipi mini şeffaf cam nargile şişesi.", description: "Rus Tipi Mini Şeffaf Şişe, saf cam yapısıyla içindeki suyu net görmenizi sağlar ve birçok nargile markasıyla uyumlu çalışır.",
    basePrice: 299, stock: 20, isFeatured: false, categorySlug: "sise-rus",
    images: [{ url: `${R4}/4514/main/29cb-rus-tipi-mini-seffaf-sise-0-1-1000x1000.jpg`, altText: "Rus Tipi Mini Şeffaf Şişe" }],
  },
  {
    slug: "hug-smart-sise", name: "Hug Smart Şişe", sku: "HL-SIS-002",
    shortDescription: "Hug Smart nargile serisi için özel cam şişe.", description: "Hug Smart Şişe, Hug Smart nargile modeline özel tasarlanmış kaliteli cam şişedir.",
    basePrice: 349, stock: 15, isFeatured: false, categorySlug: "sise-hug",
    images: [{ url: `${R4}/4515/main/09d6-hug-smart-%C5%9Fi%C5%9Fe-0-1-1000x1000.jpg`, altText: "Hug Smart Şişe" }],
  },
  {
    slug: "flash-bang-yedek-sise", name: "Amotion Flash Bang Yedek Şişe", sku: "HL-SIS-003",
    shortDescription: "Amotion Flash Bang serisi için yedek cam şişe.", description: "Amotion Flash Bang Yedek Şişe, Flash Bang serisine özel tasarlanmış yüksek kaliteli cam şişedir.",
    basePrice: 399, stock: 12, isFeatured: false, categorySlug: "sise-yedek",
    images: [{ url: `${R4}/4878/main/acab-flash-bang-yedek-sise-0-1-1000x1000.jpg`, altText: "Amotion Flash Bang Yedek Şişe" }],
  },
  {
    slug: "ay-yildiz-yedek-sise", name: "Ay Yıldız Yedek Şişe", sku: "HL-SIS-004",
    shortDescription: "Ay yıldız motifli yedek cam nargile şişesi.", description: "Ay Yıldız Yedek Şişe, Türk motifli özgün tasarımı ve yüksek kaliteli cam malzemeyle şık bir yedek şişedir.",
    basePrice: 449, stock: 10, isFeatured: false, categorySlug: "sise-yedek",
    images: [
      { url: `${R4}/4884/main/2b6e-ay-y%C4%B1ld%C4%B1z-yedek-sise-0-1-1000x1000.jpg`, altText: "Ay Yıldız Yedek Şişe" },
      { url: `${R4}/4884/additional/b930-ay-yildiz-yedek-sise-0-1-1000x1000.jpg`, altText: "Ay Yıldız Yedek Şişe Detay" },
    ],
  },
  {
    slug: "e24-big-boss-pro-x4-cam-sise", name: "E24 Big Boss Pro X-4 Cam Şişe", sku: "HL-SIS-005",
    shortDescription: "E24 Big Boss Pro X-4 modeli için yedek cam şişe.", description: "E24 Big Boss Pro X-4 Cam Şişe, bu popüler model için özel olarak üretilmiş yüksek kaliteli yedek şişedir.",
    basePrice: 499, stock: 8, isFeatured: false, categorySlug: "sise-yedek",
    images: [
      { url: `${R5}/5048/main/6bc6-e24-big-boss-pro-x-4-cam-sise--495f--0-1-1000x1000.jpg`, altText: "E24 Big Boss Pro X-4 Cam Şişe" },
      { url: `${R5}/5048/additional/332f-e24-big-boss-pro-x-4-cam-sise-0-1-1000x1000.jpg`, altText: "E24 Cam Şişe Detay" },
    ],
  },
  {
    slug: "hug-tasima-cantasi", name: "Hug Smart Taşıma Çantası", sku: "HL-AKS-001",
    shortDescription: "Hug Smart nargile için özel taşıma çantası.", description: "Hug Smart Taşıma Çantası, Hug serisi nargilelerinizi güvenli ve şık biçimde taşımanızı sağlayan özel üretim çantadır.",
    basePrice: 349, stock: 15, isFeatured: false, categorySlug: "aks-tasima-canta",
    images: [
      { url: `${R4}/4743/main/3090-hugcanta-0-1-1000x1000.png`, altText: "Hug Smart Taşıma Çantası" },
      { url: `${R4}/4743/additional/3873-smartcanta-0-1-1000x1000.jpg`, altText: "Taşıma Çantası Detay" },
    ],
  },

  // ── Moze Breeze Aksesuar Seti ──
  {
    slug: "moze-breeze-aksesuar-seti", name: "Moze Breeze Aksesuar Seti", sku: "HL-AKS-002",
    shortDescription: "Moze Breeze modeli için kapsamlı aksesuar seti.", description: "Moze Breeze Aksesuar Seti, Moze Breeze serisine uyumlu tüm gerekli aksesuarları içeren eksiksiz bir settir.",
    basePrice: 549, stock: 8, isFeatured: false, categorySlug: "aks-yedek-parca",
    images: [
      { url: `${R4}/4564/main/d9c0-mbas1-0-1-1000x1000.png`, altText: "Moze Breeze Aksesuar Seti" },
      { url: `${R4}/4564/additional/3f73-mbas2-0-1-1000x1000.png`, altText: "Moze Breeze Aksesuar Detay" },
    ],
  },

  // ── Lüleler — Ath Adalya ──
  {
    slug: "ath-adalya-arina-lule-1", name: "Ath Adalya Arina Lüle (Mor)", sku: "HL-LUL-001",
    shortDescription: "Ath Adalya Arina serisi seramik nargile lülesi, mor renk.", description: "Ath Adalya Arina Lüle, özel seramik malzeme ve phunnel tasarımıyla eşit ısı dağılımı sağlayan premium nargile lülesidir.",
    basePrice: 299, stock: 15, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4057/main/0a79-ath-adalya-arina-nargile-lulesi-dea9-0-1-1000x1000.jpg`, altText: "Ath Adalya Arina Lüle Mor" }],
  },
  {
    slug: "ath-adalya-arina-lule-2", name: "Ath Adalya Arina Lüle (Mavi)", sku: "HL-LUL-002",
    shortDescription: "Ath Adalya Arina serisi seramik nargile lülesi, mavi renk.", description: "Ath Adalya Arina Lüle, özel seramik malzeme ve phunnel tasarımıyla eşit ısı dağılımı sağlayan premium nargile lülesidir.",
    basePrice: 299, stock: 12, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4058/main/8aec-ath-adalya-arina-nargile-lulesi-245f-0-1-1000x1000.jpg`, altText: "Ath Adalya Arina Lüle Mavi" }],
  },
  {
    slug: "ath-adalya-arina-lule-3", name: "Ath Adalya Arina Lüle (Kırmızı)", sku: "HL-LUL-003",
    shortDescription: "Ath Adalya Arina serisi seramik nargile lülesi, kırmızı renk.", description: "Ath Adalya Arina Lüle, özel seramik malzeme ve phunnel tasarımıyla eşit ısı dağılımı sağlayan premium nargile lülesidir.",
    basePrice: 299, stock: 10, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4059/main/dba4-ath-adalya-arina-nargile-lulesi-4dc5-0-1-1000x1000.jpg`, altText: "Ath Adalya Arina Lüle Kırmızı" }],
  },
  {
    slug: "ath-adalya-arina-lule-4", name: "Ath Adalya Arina Lüle (Beyaz)", sku: "HL-LUL-004",
    shortDescription: "Ath Adalya Arina serisi seramik nargile lülesi, beyaz renk.", description: "Ath Adalya Arina Lüle, özel seramik malzeme ve phunnel tasarımıyla eşit ısı dağılımı sağlayan premium nargile lülesidir.",
    basePrice: 299, stock: 12, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4060/main/d49d-ath-adalya-arina-nargile-lulesi-9167-0-1-1000x1000.jpg`, altText: "Ath Adalya Arina Lüle Beyaz" }],
  },
  {
    slug: "ath-adalya-arina-lule-5", name: "Ath Adalya Arina Lüle (Siyah)", sku: "HL-LUL-005",
    shortDescription: "Ath Adalya Arina serisi seramik nargile lülesi, siyah renk.", description: "Ath Adalya Arina Lüle Siyah, özel seramik malzeme ve phunnel tasarımıyla uzun soluklu kullanım imkânı sunar.",
    basePrice: 299, stock: 14, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4061/main/7eaa-ath-adalya-arina-nargile-lulesi-9c2a-0-1-1000x1000.jpg`, altText: "Ath Adalya Arina Lüle Siyah" }],
  },
  {
    slug: "ath-adalya-arina-lule-6", name: "Ath Adalya Arina Lüle (Yeşil)", sku: "HL-LUL-006",
    shortDescription: "Ath Adalya Arina serisi seramik nargile lülesi, yeşil renk.", description: "Ath Adalya Arina Lüle Yeşil, özel seramik malzeme ve phunnel tasarımıyla premium nargile deneyimi sunar.",
    basePrice: 299, stock: 10, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4062/main/7fa3-ath-adalya-arina-nargile-lulesi-94bc-0-1-1000x1000.jpg`, altText: "Ath Adalya Arina Lüle Yeşil" }],
  },
  {
    slug: "ath-adalya-adad-lule-1", name: "Ath Adalya Adad Lüle (Kahverengi)", sku: "HL-LUL-007",
    shortDescription: "Ath Adalya Adad serisi seramik nargile lülesi, kahverengi.", description: "Ath Adalya Adad Lüle, farklı doku ve renk seçenekleriyle üretilen premium seramik nargile lülesidir.",
    basePrice: 349, stock: 10, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4067/main/079b-ath-adalya-adad-nargile-lulesi-7cd2-0-1-1000x1000.jpg`, altText: "Ath Adalya Adad Lüle Kahverengi" }],
  },
  {
    slug: "ath-adalya-adad-lule-2", name: "Ath Adalya Adad Lüle (Gri)", sku: "HL-LUL-008",
    shortDescription: "Ath Adalya Adad serisi seramik nargile lülesi, gri renk.", description: "Ath Adalya Adad Lüle Gri, farklı doku ve gri rengiyle üretilen premium seramik nargile lülesidir.",
    basePrice: 349, stock: 10, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4068/main/1d0c-ath-adalya-adad-nargile-lulesi-0129-0-1-1000x1000.jpg`, altText: "Ath Adalya Adad Lüle Gri" }],
  },
  {
    slug: "ath-adalya-adad-lule-3", name: "Ath Adalya Adad Lüle (Turuncu)", sku: "HL-LUL-009",
    shortDescription: "Ath Adalya Adad serisi seramik nargile lülesi, turuncu renk.", description: "Ath Adalya Adad Lüle Turuncu, canlı rengi ve premium seramik malzemeyle şık bir nargile lülesidir.",
    basePrice: 349, stock: 8, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4069/main/43b1-ath-adalya-adad-nargile-lulesi-5239-0-1-1000x1000.jpg`, altText: "Ath Adalya Adad Lüle Turuncu" }],
  },
  {
    slug: "ath-adalya-adad-lule-4", name: "Ath Adalya Adad Lüle (Mavi)", sku: "HL-LUL-010",
    shortDescription: "Ath Adalya Adad serisi seramik nargile lülesi, mavi renk.", description: "Ath Adalya Adad Lüle Mavi, mavi rengi ve premium seramik yapısıyla uzun süreli kullanım için tasarlanmış nargile lülesidir.",
    basePrice: 349, stock: 9, isFeatured: false, categorySlug: "lule-ath-adalya",
    images: [{ url: `${R4}/4070/main/047c-ath-adalya-adad-nargile-lulesi-38c1-0-1-1000x1000.jpg`, altText: "Ath Adalya Adad Lüle Mavi" }],
  },

  // ── Cosmo Lüle ──
  {
    slug: "cosmo-lule", name: "Cosmo Lüle", sku: "HL-LUL-011",
    shortDescription: "Cosmo seramik nargile lülesi, phunnel tasarım.", description: "Cosmo Lüle, phunnel delikli yapısıyla eşit ısı dağılımı sağlayan ve geniş hacmiyle uzun süre keyif sunan seramik nargile lülesidir.",
    basePrice: 399, stock: 12, isFeatured: false, categorySlug: "lule-j-o",
    images: [{ url: `${R4}/4193/main/678c-cosmo-lule-(1)-0-1-1000x1000.jpg`, altText: "Cosmo Lüle" }],
  },
  {
    slug: "cosmo-killer-lule", name: "Cosmo Killer Lüle", sku: "HL-LUL-012",
    shortDescription: "Cosmo Killer seramik nargile lülesi, gelişmiş phunnel tasarım.", description: "Cosmo Killer Lüle, gelişmiş phunnel tasarımı ve geniş ağzıyla daha fazla kömür taşıyan premium seramik nargile lülesidir.",
    basePrice: 449, stock: 10, isFeatured: false, categorySlug: "lule-j-o",
    images: [
      { url: `${R4}/4632/main/179d-cosmokiller-0-1-1000x1000.jpg`, altText: "Cosmo Killer Lüle" },
      { url: `${R4}/4632/additional/2689-cosmokiller1-0-1-1000x1000.jpg`, altText: "Cosmo Killer Lüle Detay" },
    ],
  },
  {
    slug: "cosmo-mixology-phunnel-lule", name: "Cosmo Mixology Phunnel Lüle", sku: "HL-LUL-013",
    shortDescription: "Cosmo Mixology phunnel seramik nargile lülesi.", description: "Cosmo Mixology Phunnel Lüle, özel mixology tasarımı ve geniş hacmiyle uzun ve lezzetli nargile seansları için idealdir.",
    basePrice: 499, stock: 8, isFeatured: false, categorySlug: "lule-j-o",
    images: [
      { url: `${R4}/4932/main/0795-cosmo-mixology-phunnel-bowl-0-1-1000x1000.jpg`, altText: "Cosmo Mixology Phunnel Lüle" },
      { url: `${R4}/4932/additional/255e-cosmo-mixology-phunnel-bowl-2-0-1-1000x1000.jpg`, altText: "Cosmo Mixology Phunnel Detay" },
    ],
  },
  {
    slug: "cosmo-bowl-predator", name: "Cosmo Bowl Predator", sku: "HL-LUL-014",
    shortDescription: "Cosmo Bowl Predator serisi seramik nargile lülesi.", description: "Cosmo Bowl Predator, Predator figürlü özgün tasarımıyla koleksiyon değeri taşıyan premium seramik nargile lülesidir.",
    basePrice: 549, stock: 6, isFeatured: false, categorySlug: "lule-j-o",
    images: [
      { url: `${R4}/4818/main/c77d-cosmo-bowl-predator-0-1-1000x1000.jpg`, altText: "Cosmo Bowl Predator" },
      { url: `${R4}/4818/additional/01bb-cosmo-bowl-future-dragon-0-1-1000x1000.jpg`, altText: "Cosmo Bowl Future Dragon" },
    ],
  },
  {
    slug: "cosmo-bowl-asia-killer", name: "Cosmo Bowl Asia Killer", sku: "HL-LUL-015",
    shortDescription: "Cosmo Bowl Asia Killer serisi seramik nargile lülesi.", description: "Cosmo Bowl Asia Killer, Asia ilhamlı özel tasarımı ve geniş hacmiyle uzun nargile seansları için tasarlanmış premium seramik lüledir.",
    basePrice: 549, stock: 6, isFeatured: false, categorySlug: "lule-j-o",
    images: [
      { url: `${R4}/4892/main/0005-cosmo-bowl-asia-killer-0-1-1000x1000.jpg`, altText: "Cosmo Bowl Asia Killer" },
      { url: `${R4}/4892/additional/5e56-cosmo-bowl-asia-0-1-1000x1000.jpg`, altText: "Cosmo Bowl Asia" },
    ],
  },
  {
    slug: "cosmo-bowl-classic-predator", name: "Cosmo Bowl Classic Predator", sku: "HL-LUL-016",
    shortDescription: "Cosmo Bowl Classic Predator serisi seramik nargile lülesi.", description: "Cosmo Bowl Classic Predator, klasik predator formu ve premium seramik yapısıyla koleksiyon değeri taşıyan nargile lülesidir.",
    basePrice: 449, stock: 7, isFeatured: false, categorySlug: "lule-j-o",
    images: [{ url: `${R4}/4894/main/85d0-cosmo-bowl-classic-predator-0-1-1000x1000.jpg`, altText: "Cosmo Bowl Classic Predator" }],
  },
  {
    slug: "cosmo-bowl-st-patrick", name: "Cosmo Bowl St. Patrick Edition", sku: "HL-LUL-017",
    shortDescription: "Cosmo Bowl St. Patrick özel edisyon seramik nargile lülesi.", description: "Cosmo Bowl St. Patrick Edition, St. Patrick temalı özel tasarımıyla sınırlı üretim premium seramik nargile lülesidir.",
    basePrice: 599, stock: 5, isFeatured: false, categorySlug: "lule-j-o",
    images: [
      { url: `${R5}/5029/main/2ab3-cosmo-bowl-st-patrick-edition-3-0-1-1000x1000.jpg`, altText: "Cosmo Bowl St. Patrick Edition" },
      { url: `${R5}/5029/additional/34bb-cosmo-bowl-st-patrick-edition-0-1-1000x1000.jpg`, altText: "Cosmo Bowl St. Patrick Detay" },
    ],
  },

  // ── Darkside Lüle ──
  {
    slug: "darkside-d-classic-bowl", name: "Darkside D-Classic Bowl", sku: "HL-LUL-018",
    shortDescription: "Darkside D-Classic Bowl seramik nargile lülesi.", description: "Darkside D-Classic Bowl, klasik form ve premium seramik malzemeyle hem kullanışlı hem de estetik bir nargile lülesidir.",
    basePrice: 349, stock: 12, isFeatured: false, categorySlug: "lule-a-h",
    images: [{ url: `${R4}/4947/main/c5ce-darkside-dclassic-bowl-3-0-1-1000x1000.jpg`, altText: "Darkside D-Classic Bowl" }],
  },
  {
    slug: "darkside-d-shot-bowl", name: "Darkside D-Shot Bowl", sku: "HL-LUL-019",
    shortDescription: "Darkside D-Shot Bowl seramik nargile lülesi.", description: "Darkside D-Shot Bowl, Shot tasarımlı kompakt form ve premium seramik malzemeyle özgün bir nargile lülesidir.",
    basePrice: 379, stock: 10, isFeatured: false, categorySlug: "lule-a-h",
    images: [
      { url: `${R4}/4948/main/4fac-darkside-d-shot-hookah-bowl-0-1-1000x1000.jpg`, altText: "Darkside D-Shot Bowl" },
      { url: `${R4}/4948/additional/7c61-dark-side-bowl-d-shot-2(1)-0-1-1000x1000.jpg`, altText: "Darkside D-Shot Bowl Detay" },
    ],
  },

  // ── Quasar Lüle ──
  {
    slug: "quasar-petit-raas-lule", name: "Quasar Petit Raas Lüle", sku: "HL-LUL-020",
    shortDescription: "Quasar Petit Raas seramik nargile lülesi.", description: "Quasar Petit Raas, kompakt ölçüleriyle az miktarda kullanıma uygun, phunnel delikli premium seramik nargile lülesidir.",
    basePrice: 449, stock: 8, isFeatured: false, categorySlug: "lule-quasar",
    images: [
      { url: `${R4}/4939/main/d274-quasar-petit-raas-2-2-0-1-1000x1000.jpg`, altText: "Quasar Petit Raas" },
      { url: `${R4}/4939/additional/2cb3-quasar-petit-raas-2-3-0-1-1000x1000.jpg`, altText: "Quasar Petit Raas Detay" },
    ],
  },
  {
    slug: "quasar-raas-lule", name: "Quasar Raas Lüle", sku: "HL-LUL-021",
    shortDescription: "Quasar Raas seramik nargile lülesi, geniş ağızlı.", description: "Quasar Raas, geniş ağzı ve derin yapısıyla uzun nargile seansları için tasarlanmış premium seramik nargile lülesidir.",
    basePrice: 499, stock: 7, isFeatured: false, categorySlug: "lule-quasar",
    images: [
      { url: `${R4}/4944/main/c9cf-quasar-raas-2-0-1-1000x1000.jpg`, altText: "Quasar Raas Lüle" },
      { url: `${R4}/4944/additional/490b-quasar-raas-2-4-0-1-1000x1000.jpg`, altText: "Quasar Raas Detay" },
    ],
  },

  // ── Japona Lüle ──
  {
    slug: "japona-chasha-bowl-lule", name: "Japona Chasha Bowl Lüle", sku: "HL-LUL-022",
    shortDescription: "Japona Chasha Bowl seramik nargile lülesi.", description: "Japona Chasha Bowl, Japon esintili tasarımı ve premium seramik malzemeyle şık bir nargile lülesidir.",
    basePrice: 449, stock: 8, isFeatured: false, categorySlug: "lule-japona",
    images: [
      { url: `${R5}/5021/main/5561-japona-chasha-bowl-lule-3-0-1-1000x1000.jpg`, altText: "Japona Chasha Bowl" },
      { url: `${R5}/5021/additional/0b16-japona-chasha-bowl-lule-2-0-1-1000x1000.jpg`, altText: "Japona Chasha Bowl Detay" },
    ],
  },
  {
    slug: "japona-samurai-bowl-lule", name: "Japona Samurai Bowl Lüle", sku: "HL-LUL-023",
    shortDescription: "Japona Samurai Bowl seramik nargile lülesi.", description: "Japona Samurai Bowl, Samuray temalı özgün tasarımı ve premium seramik malzemeyle koleksiyon değeri taşıyan nargile lülesidir.",
    basePrice: 549, stock: 6, isFeatured: false, categorySlug: "lule-japona",
    images: [
      { url: `${R5}/5045/main/83f5-japona-samurai-bowl-0-1-1000x1000.jpg`, altText: "Japona Samurai Bowl" },
      { url: `${R5}/5045/additional/71bc-foyer-japona-hookah-samurai-bowl-0-1-1000x1000.jpg`, altText: "Japona Samurai Bowl Detay" },
    ],
  },

  // ── Kömürler ──
  {
    slug: "coco-pearls-1000gr", name: "Coco Pearls 1000 gr", sku: "HL-KOM-001",
    shortDescription: "Hindistan cevizi kabuğundan üretilmiş doğal kömür, 1 kg.", description: "Coco Pearls 1000 gr, hindistan cevizi kabuğundan üretilen yuvarlak formlu doğal kömürlerdir. Uzun süre yanan, düşük kül bırakan yapısıyla nargile tutkunlarının tercihi.",
    basePrice: 199, stock: 30, isFeatured: false, categorySlug: "komur-coco-pearls",
    images: [
      { url: `${R4}/4006/main/2f6b-coc1%20(1)-0-1-1000x1000.jpg`, altText: "Coco Pearls 1000 gr" },
      { url: `${R4}/4006/additional/a542-coc2%20(1)-0-1-1000x1000.jpg`, altText: "Coco Pearls 1000 gr Detay" },
    ],
  },
  {
    slug: "coco-pearls-500gr", name: "Coco Pearls 500 gr", sku: "HL-KOM-002",
    shortDescription: "Hindistan cevizi kabuğundan üretilmiş doğal kömür, 500 gr.", description: "Coco Pearls 500 gr, hindistan cevizi kabuğundan üretilen yuvarlak formlu doğal kömürlerdir. 500 gramlık ekonomik boy.",
    basePrice: 119, stock: 25, isFeatured: false, categorySlug: "komur-coco-pearls",
    images: [
      { url: `${R4}/4007/main/4419-cocoperls500-0-1-1000x1000.jpg`, altText: "Coco Pearls 500 gr" },
      { url: `${R4}/4007/additional/850b-cocoperal5001-0-1-1000x1000.jpg`, altText: "Coco Pearls 500 gr Detay" },
    ],
  },
  {
    slug: "coco-pearls-27er", name: "Coco Pearls 27mm 1 kg", sku: "HL-KOM-003",
    shortDescription: "27mm boyutlu hindistan cevizi kömürü, 1 kg.", description: "Coco Pearls 27mm, 27 milimetrelik küp formuyla standart nargile lüleleri için ideal boyutta doğal hindistan cevizi kömürüdür.",
    basePrice: 219, stock: 20, isFeatured: false, categorySlug: "komur-coco-pearls",
    images: [
      { url: `${R4}/4509/main/2e73-cocopea27-(1)-0-1-1000x1000.png`, altText: "Coco Pearls 27mm" },
      { url: `${R4}/4509/additional/3051-cocopearl27-0-1-1000x1000.jpg`, altText: "Coco Pearls 27mm Detay" },
    ],
  },
  {
    slug: "cocodalya-26er", name: "Cocodalya 26mm Kömür 1 kg", sku: "HL-KOM-004",
    shortDescription: "Cocodalya 26mm hindistan cevizi kömürü, 1 kg.", description: "Cocodalya 26mm, hindistan cevizi kabuğundan üretilen 26mm boyutlu küp kömürlerdir. Eşit yanma ve düşük kül özellikleriyle öne çıkar.",
    basePrice: 189, stock: 25, isFeatured: false, categorySlug: "komur-cocodalya",
    images: [
      { url: `${R4}/4010/main/f0c0-cocodly26-(1)-0-1-1000x1000.jpg`, altText: "Cocodalya 26mm" },
      { url: `${R4}/4010/additional/22a2-cocodlyy-0-1-1000x1000.jpg`, altText: "Cocodalya Detay" },
    ],
  },
  {
    slug: "cocodalya-27er", name: "Cocodalya 27mm Kömür 1 kg", sku: "HL-KOM-005",
    shortDescription: "Cocodalya 27mm hindistan cevizi kömürü, 1 kg.", description: "Cocodalya 27mm, hindistan cevizi kabuğundan üretilen 27mm boyutlu küp kömürlerdir.",
    basePrice: 199, stock: 20, isFeatured: false, categorySlug: "komur-cocodalya",
    images: [
      { url: `${R4}/4728/main/edc7-dly27-0-1-1000x1000.jpg`, altText: "Cocodalya 27mm" },
      { url: `${R4}/4728/additional/41fd-cocodal27-0-1-1000x1000.png`, altText: "Cocodalya 27mm Detay" },
    ],
  },
  {
    slug: "one-nation-26er", name: "One Nation 26mm Kömür 1 kg", sku: "HL-KOM-006",
    shortDescription: "One Nation 26mm hindistan cevizi kömürü, 1 kg.", description: "One Nation 26mm, Alman teknolojisiyle üretilen kaliteli hindistan cevizi kömürleridir. Uzun yanma süresi ve düşük kül oranıyla tanınır.",
    basePrice: 219, stock: 20, isFeatured: false, categorySlug: "komur-one-nation",
    images: [
      { url: `${R4}/4019/main/eba5-onenation26yeni-0-1-1000x1000.jpg`, altText: "One Nation 26mm" },
      { url: `${R4}/4019/additional/f170-one-nation-26er-nargile-komuru-1-kg-8324d5-0-1-1000x1000.jpg`, altText: "One Nation 26mm Detay" },
    ],
  },
  {
    slug: "one-nation-27er", name: "One Nation 27mm Kömür 1 kg", sku: "HL-KOM-007",
    shortDescription: "One Nation 27mm hindistan cevizi kömürü, 1 kg.", description: "One Nation 27mm, büyük lüleler için uygun 27mm boyutunda üretilen premium kömürlerdir.",
    basePrice: 229, stock: 18, isFeatured: false, categorySlug: "komur-one-nation",
    images: [
      { url: `${R4}/4020/main/1f00-one-nation-27-0-1-1000x1000.jpg`, altText: "One Nation 27mm" },
      { url: `${R4}/4020/additional/1b77-one-nation-27-1-0-1-1000x1000.jpg`, altText: "One Nation 27mm Detay" },
    ],
  },
  {
    slug: "one-nation-28er", name: "One Nation 28mm Kömür 1 kg", sku: "HL-KOM-008",
    shortDescription: "One Nation 28mm hindistan cevizi kömürü, 1 kg.", description: "One Nation 28mm, büyük phunnel lüleler için ideal 28mm boyutunda üretilen premium kömürlerdir.",
    basePrice: 239, stock: 15, isFeatured: false, categorySlug: "komur-one-nation",
    images: [
      { url: `${R4}/4021/main/f6eb-one-nation-28-er-nargile-komuru-0-1-1000x1000.jpg`, altText: "One Nation 28mm" },
      { url: `${R4}/4021/additional/ed98-one-nation-28-er-nargile-komuru-1-0-1-1000x1000.jpg`, altText: "One Nation 28mm Detay" },
    ],
  },
  {
    slug: "one-nation-360", name: "One Nation 360 Kömür 1 kg", sku: "HL-KOM-009",
    shortDescription: "One Nation 360 yuvarlak formlu hindistan cevizi kömürü, 1 kg.", description: "One Nation 360, yuvarlak formuyla standart nargile lülelerine mükemmel oturan premium hindistan cevizi kömürüdür.",
    basePrice: 229, stock: 20, isFeatured: false, categorySlug: "komur-one-nation",
    images: [
      { url: `${R4}/4022/main/4373-one-nation-360-nargile-komuru-0-1-1000x1000.jpg`, altText: "One Nation 360" },
      { url: `${R4}/4022/additional/4f59-one-nation-360-0-1-1000x1000.jpg`, altText: "One Nation 360 Detay" },
    ],
  },
  {
    slug: "coco-loco-26er", name: "Coco Loco 26mm Kömür 1 kg", sku: "HL-KOM-010",
    shortDescription: "Coco Loco 26mm hindistan cevizi kömürü, 1 kg.", description: "Coco Loco 26mm, eşit yanma özellikleri ve düşük kül oranıyla nargile deneyimini üst seviyeye taşıyan premium kömürlerdir.",
    basePrice: 189, stock: 22, isFeatured: false, categorySlug: "komur-cocoloco",
    images: [
      { url: `${R4}/4469/main/7846-coco-loco-26-er-nargile-komuru-1-0-1-1000x1000.jpg`, altText: "Coco Loco 26mm" },
      { url: `${R4}/4469/additional/6102-coco-loco-26-er-nargile-komuru-0-1-1000x1000.jpg`, altText: "Coco Loco 26mm Detay" },
    ],
  },
  {
    slug: "black-coco-27er", name: "Black Coco 27mm Kömür 1 kg", sku: "HL-KOM-011",
    shortDescription: "Black Coco 27mm premium hindistan cevizi kömürü, 1 kg.", description: "Black Coco 27mm, siyah kaplama ve premium kalite hindistan cevizi kömürleridir. Yüksek ısı kapasitesi ve uzun yanma süresiyle öne çıkar.",
    basePrice: 249, compareAtPrice: 299, stock: 18, isFeatured: true, categorySlug: "komur-black-coco",
    images: [
      { url: `${R4}/4783/main/98ce-black-cocos-27-nargile-k%C3%B6m%C3%BCr%C3%BC-4-0-1-1000x1000.jpg`, altText: "Black Coco 27mm" },
      { url: `${R4}/4783/additional/1634-black-cocos-27-nargile-k%C3%B6m%C3%BCr%C3%BC-5-0-1-1000x1000.jpg`, altText: "Black Coco 27mm Detay" },
    ],
  },
  {
    slug: "black-coco-s-kutusuz", name: "Black Coco S Kömür Kutusuz 1 kg", sku: "HL-KOM-012",
    shortDescription: "Black Coco S premium hindistan cevizi kömürü, kutusuz 1 kg.", description: "Black Coco S Kutusuz, ekonomik ambalajda sunulan premium hindistan cevizi kömürüdür. Yüksek kaliteli yanma özelliğiyle öne çıkar.",
    basePrice: 229, stock: 20, isFeatured: false, categorySlug: "komur-black-coco",
    images: [
      { url: `${R5}/5005/main/3418-black-coco-s-nargile-komuru-kutusuz-0-1-1000x1000.jpg`, altText: "Black Coco S Kutusuz" },
      { url: `${R5}/5005/additional/d1e1-black-coco-s-nargile-komuru-kutusuz-1-0-1-1000x1000.jpg`, altText: "Black Coco S Detay" },
    ],
  },
  {
    slug: "kefo-gold-hindistan-cevizi-komur", name: "Kefo Gold Hindistan Cevizi Kömürü 1 kg", sku: "HL-KOM-013",
    shortDescription: "Kefo Gold hindistan cevizi kömürü, 1 kg.", description: "Kefo Gold Hindistan Cevizi Kömürü, Kefo'nun altın serisi olup uzun yanma süresi ve düşük kül oranıyla kullanıcıların favorisi arasındadır.",
    basePrice: 229, stock: 20, isFeatured: false, categorySlug: "komur-kefo",
    images: [{ url: `${R4}/4013/main/d612-kefo-gold-hindistan-cevizi-komuru1jpg-(1)-0-1-1000x1000.jpg`, altText: "Kefo Gold Hindistan Cevizi Kömürü" }],
  },
  {
    slug: "kefo-26er-komur", name: "Kefo 26mm Kömür 1 kg", sku: "HL-KOM-014",
    shortDescription: "Kefo 26mm hindistan cevizi kömürü, 1 kg.", description: "Kefo 26mm, standart kare formlu hindistan cevizi kömürüdür. Düzenli yanma ve uygun fiyatıyla tercih edilir.",
    basePrice: 199, stock: 22, isFeatured: false, categorySlug: "komur-kefo",
    images: [{ url: `${R4}/4729/main/b214-kefo26-0-1-1000x1000.png`, altText: "Kefo 26mm Kömür" }],
  },
  {
    slug: "town-coco-1kg", name: "Town Coco's 1 kg Kömür", sku: "HL-KOM-015",
    shortDescription: "Town Coco's hindistan cevizi kömürü, 1 kg.", description: "Town Coco's 1 kg, özel işlenmiş hindistan cevizi kabuğundan üretilen kaliteli kömürlerdir.",
    basePrice: 179, stock: 20, isFeatured: false, categorySlug: "komur-town-cocos",
    images: [{ url: `${R4}/4025/main/d252-tcoc1kg-0-1-1000x1000.jpg`, altText: "Town Coco's 1 kg" }],
  },

  // ── Marpuçlar ──
  {
    slug: "moze-sipsi", name: "Moze Sipsi", sku: "HL-MAR-001",
    shortDescription: "Moze marka nargile sipsisi, çeşitli renk seçenekleriyle.", description: "Moze Sipsi, alüminyum gövdesi ve ergonomik ağızlığıyla uzun süreli kullanım için ideal olan premium nargile sipsisidir.",
    basePrice: 249, stock: 18, isFeatured: false, categorySlug: "sipsi-moze",
    images: [
      { url: `${R4}/4105/main/853c-moze-sipsi-nargile-store-0-1-1000x1000.jpg`, altText: "Moze Sipsi" },
      { url: `${R4}/4105/additional/44d4-Moze-Sipsi-Wavy-Red_1-0-1-1000x1000.jpg`, altText: "Moze Sipsi Wavy Red" },
    ],
  },
  {
    slug: "alpha-joy-sipsi", name: "Alpha Joy Sipsi", sku: "HL-MAR-002",
    shortDescription: "Alpha Joy nargile sipsisi, çeşitli renk seçenekleriyle.", description: "Alpha Joy Sipsi, Alpha serisiyle uyumlu ve renkli tasarım seçenekleriyle kişiselleştirilebilen premium nargile sipsisidir.",
    basePrice: 279, stock: 15, isFeatured: false, categorySlug: "sipsi-alpha",
    images: [
      { url: `${R5}/5019/main/5d9f-alpha-joy-sipsi-2-0-1-1000x1000.jpg`, altText: "Alpha Joy Sipsi" },
      { url: `${R5}/5019/additional/4d57-alpha-joy-sipsi-5-0-1-1000x1000.jpg`, altText: "Alpha Joy Sipsi Detay" },
    ],
  },
  {
    slug: "amotion-calve-mouthpiece", name: "Amotion Calve Mouthpiece", sku: "HL-MAR-003",
    shortDescription: "Amotion Calve marka nargile ağızlığı.", description: "Amotion Calve Mouthpiece, Amotion nargilelerine uyumlu ergonomik tasarımlı premium nargile ağızlığıdır.",
    basePrice: 199, stock: 20, isFeatured: false, categorySlug: "marpuc-basligi",
    images: [
      { url: `${R5}/5039/main/1554-amotion-calve-mouthpiece-0-1-1000x1000.jpg`, altText: "Amotion Calve Mouthpiece" },
      { url: `${R5}/5039/additional/8d35-amotion-calve-mouthpiece-1_1-0-1-1000x1000.jpg`, altText: "Amotion Calve Mouthpiece Detay" },
    ],
  },
  {
    slug: "amotion-marpuc-basligi", name: "Amotion Marpuç Başlığı", sku: "HL-MAR-004",
    shortDescription: "Amotion serisi için nargile marpuç başlığı.", description: "Amotion Marpuç Başlığı, Amotion serisine uyumlu ergonomik tasarımıyla konforu artıran premium marpuç başlığıdır.",
    basePrice: 149, stock: 25, isFeatured: false, categorySlug: "marpuc-basligi",
    images: [{ url: `${R4}/4625/main/f5d9-amomarpucbasl%C4%B1g%C4%B1-0-1-1000x1000.jpg`, altText: "Amotion Marpuç Başlığı" }],
  },
  {
    slug: "gamer-nargile-marpucu", name: "Gamer Nargile Marpucu", sku: "HL-MAR-005",
    shortDescription: "Gamer temalı nargile marpucu.", description: "Gamer Nargile Marpucu, oyun tutkunları için özel tasarlanmış renkli ve ergonomik bir nargile marpucudur.",
    basePrice: 329, stock: 12, isFeatured: false, categorySlug: "marpuc-buzlu",
    images: [
      { url: `${R4}/4809/main/406e-gamer-marpuc-2-0-1-1000x1000.jpg`, altText: "Gamer Nargile Marpucu" },
      { url: `${R4}/4809/additional/0d83-gamer-nargile-marpucu-0-1-1000x1000.jpg`, altText: "Gamer Marpuç Detay" },
    ],
  },
  {
    slug: "moze-amotion-valf", name: "Moze Amotion Valf", sku: "HL-MAR-006",
    shortDescription: "Moze Amotion serisi nargile valfı.", description: "Moze Amotion Valf, Moze ve Amotion nargilelerine uyumlu hassas kontrol sağlayan premium nargile valfıdır.",
    basePrice: 179, stock: 15, isFeatured: false, categorySlug: "aks-yedek-parca",
    images: [
      { url: `${R5}/5041/main/91de-moze-amotion-valve-0-1-1000x1000.jpg`, altText: "Moze Amotion Valf" },
      { url: `${R5}/5041/additional/be43-moze-amotion-valve-1-0-1-1000x1000.jpg`, altText: "Moze Amotion Valf Detay" },
    ],
  },

  // ── Aksesuarlar ──
  {
    slug: "kutulu-folyo", name: "Kutulu Nargile Folyosu", sku: "HL-AKS-003",
    shortDescription: "Kutulu nargile folyosu, çift kat alüminyum.", description: "Kutulu Nargile Folyosu, çift katlı alüminyum yapısıyla dayanıklı ve kolay kullanımlı nargile folyosudur.",
    basePrice: 79, stock: 40, isFeatured: false, categorySlug: "aks-folyo",
    images: [
      { url: `${R4}/4208/main/6aeb-kutulu-folyo-0-1-1000x1000.jpg`, altText: "Kutulu Nargile Folyosu" },
      { url: `${R4}/4208/additional/04ef-kutulu-folyo-1-0-1-1000x1000.jpg`, altText: "Kutulu Folyo Detay" },
    ],
  },
  {
    slug: "kefo-cakmak", name: "Kefo Çakmak", sku: "HL-AKS-004",
    shortDescription: "Kefo marka nargile kömürü yakma çakmağı.", description: "Kefo Çakmak, güçlü alevi ve uzun ömrüyle kömür yakma işlemini kolaylaştıran nargile aksesuarıdır.",
    basePrice: 129, stock: 25, isFeatured: false, categorySlug: "aks-sarf",
    images: [{ url: `${R4}/4012/main/0f4a-kefo%C3%A7akmak1-(1)-0-1-1000x1000.jpg`, altText: "Kefo Çakmak" }],
  },
  {
    slug: "kefo-masa-tasi", name: "Kefo Masa Taşı", sku: "HL-AKS-005",
    shortDescription: "Kefo masa kömür tutacağı.", description: "Kefo Masa Taşı, kömür transferini güvenli ve pratik hale getiren paslanmaz çelik aksesuar.",
    basePrice: 149, stock: 20, isFeatured: false, categorySlug: "aks-koz-masalari",
    images: [{ url: `${R4}/4225/main/c079-kefo-masa-0-1-1000x1000.jpg`, altText: "Kefo Masa Taşı" }],
  },
  {
    slug: "ahsap-folyo-delme-ignesi", name: "Ahşap Saplı Folyo Delme İğnesi", sku: "HL-AKS-006",
    shortDescription: "Ahşap saplı nargile folyosu delme iğnesi.", description: "Ahşap Saplı Folyo Delme İğnesi, ergonomik ahşap sapı ve paslanmaz çelik ucuyla folyo delmek için tasarlanmış özel aksesuardır.",
    basePrice: 59, stock: 35, isFeatured: false, categorySlug: "aks-catal-igne",
    images: [
      { url: `${R4}/4920/main/b8fe-ahsap-folyo-delme-ignesi-0-1-1000x1000.jpg`, altText: "Ahşap Saplı Folyo Delme İğnesi" },
      { url: `${R4}/4920/additional/b54a-fol-delme-ignesi-0-1-1000x1000.jpg`, altText: "Folyo Delme İğnesi Detay" },
    ],
  },
  {
    slug: "folyo-delme-ignesi", name: "Folyo Delme İğnesi Seti", sku: "HL-AKS-007",
    shortDescription: "Nargile folyosu delme iğnesi seti.", description: "Folyo Delme İğnesi Seti, farklı delik boyutlarında delik açmanızı sağlayan çeşitli uçlara sahip aksesuardır.",
    basePrice: 89, stock: 30, isFeatured: false, categorySlug: "aks-catal-igne",
    images: [
      { url: `${R5}/5057/main/8796-folyo-delme-ignesi-2-0-1-1000x1000.jpg`, altText: "Folyo Delme İğnesi Seti" },
      { url: `${R5}/5057/additional/2e1b-folyo-delme-ignesi-1-0-1-1000x1000.jpg`, altText: "Folyo Delme İğnesi Detay" },
    ],
  },
  {
    slug: "alpha-oro-tongs", name: "Alpha Oro Maşa", sku: "HL-AKS-008",
    shortDescription: "Alpha Oro serisi premium nargile maşası.", description: "Alpha Oro Maşa, altın kaplama detayları ve paslanmaz çelik yapısıyla hem şık hem de dayanıklı bir nargile maşasıdır.",
    basePrice: 199, stock: 15, isFeatured: false, categorySlug: "aks-koz-masalari",
    images: [
      { url: `${R5}/5018/main/a243-alpha-oro-tongs-1-0-1-1000x1000.jpg`, altText: "Alpha Oro Maşa" },
      { url: `${R5}/5018/additional/3bf8-alpha-oro-tongs-0-1-1000x1000.jpg`, altText: "Alpha Oro Maşa Detay" },
    ],
  },
  {
    slug: "darkside-d-tongs", name: "Darkside D-Tongs Maşa", sku: "HL-AKS-009",
    shortDescription: "Darkside D-Tongs marka nargile maşası.", description: "Darkside D-Tongs, paslanmaz çelik yapısı ve ergonomik tasarımıyla pratik kullanım sunan premium nargile maşasıdır.",
    basePrice: 179, stock: 18, isFeatured: false, categorySlug: "aks-koz-masalari",
    images: [
      { url: `${R5}/5026/main/1ecb-dark-side-d-tongs-2-0-1-1000x1000.jpg`, altText: "Darkside D-Tongs" },
      { url: `${R5}/5026/additional/1f52-dark-side-d-tongs-1-0-1-160x240.png`, altText: "Darkside D-Tongs Detay" },
    ],
  },
  {
    slug: "darkside-d-tongs-30", name: "Darkside D-Tongs 30 Maşa", sku: "HL-AKS-010",
    shortDescription: "Darkside D-Tongs 30 uzun nargile maşası.", description: "Darkside D-Tongs 30, 30 cm uzunluğu ve paslanmaz çelik yapısıyla büyük lüleli nargileler için ideal uzun kollu maşadır.",
    basePrice: 199, stock: 15, isFeatured: false, categorySlug: "aks-koz-masalari",
    images: [
      { url: `${R5}/5027/main/a55f-dark-side-d-tongs-30-1-0-1-1000x1000.jpg`, altText: "Darkside D-Tongs 30" },
      { url: `${R5}/5027/additional/c387-dark-side-d-tongs-30-0-1-1000x1000.jpg`, altText: "Darkside D-Tongs 30 Detay" },
    ],
  },
  {
    slug: "darkside-d-click", name: "Darkside D-Click Kömür Tutucu", sku: "HL-AKS-011",
    shortDescription: "Darkside D-Click marka kömür tutucu/kıskaç.", description: "Darkside D-Click, tek el operasyonuyla kömürleri kolayca tutmanızı sağlayan pratik kıskaç tasarımlı nargile aksesuarıdır.",
    basePrice: 219, stock: 12, isFeatured: false, categorySlug: "aks-koz-masalari",
    images: [
      { url: `${R5}/5028/main/8056-dark-side-d-click-0-1-1000x1000.jpg`, altText: "Darkside D-Click" },
      { url: `${R5}/5028/additional/7002-dark-side-d-click-2-0-1-1000x1000.jpg`, altText: "Darkside D-Click Detay" },
    ],
  },
  {
    slug: "mr-eds-ruzgarlik", name: "Mr. EDS Rüzgarlık", sku: "HL-AKS-012",
    shortDescription: "Mr. EDS marka nargile rüzgarlığı, çeşitli renklerde.", description: "Mr. EDS Rüzgarlık, rüzgarda kömür tutmayı kolaylaştıran, altın/gümüş/bronz renk seçenekleriyle sunulan premium nargile aksesuarıdır.",
    basePrice: 249, stock: 12, isFeatured: false, categorySlug: "aks-ruzgarlik",
    images: [
      { url: `${R5}/5054/main/5726-eds-ruzgarlik-gold-0-1-1000x1000.jpg`, altText: "Mr. EDS Rüzgarlık Altın" },
      { url: `${R5}/5054/additional/141d-eds-ruzgarlik-silver-0-1-1000x1000.jpg`, altText: "Mr. EDS Rüzgarlık Gümüş" },
    ],
  },

  // ── Isı Yönetimi ──
  {
    slug: "maxx-royal-crown-titan-hmd", name: "Maxx Royal Crown Titan HMD", sku: "HL-ISI-001",
    shortDescription: "Maxx Royal Crown Titan ısı yönetim cihazı.", description: "Maxx Royal Crown Titan HMD, kömürü lüle üzerinde sabit tutarak eşit ısı dağılımı sağlayan profesyonel ısı yönetim cihazıdır.",
    basePrice: 799, compareAtPrice: 999, stock: 8, isFeatured: true, categorySlug: "hmd-apex",
    images: [
      { url: `${R5}/5010/main/e817-crown-titan-hmd-kozluk-70d35--0-1-1000x1000.jpg`, altText: "Maxx Royal Crown Titan HMD" },
      { url: `${R5}/5010/additional/3dcc-maxx-crown-hmd-2-0-1-1000x1000.jpg`, altText: "Maxx Royal Crown HMD Detay" },
    ],
  },
  {
    slug: "maxx-guard-titan-black-hmd", name: "Maxx Guard Titan Black HMD", sku: "HL-ISI-002",
    shortDescription: "Maxx Guard Titan Black ısı yönetim cihazı, siyah.", description: "Maxx Guard Titan Black HMD, siyah titanyum kaplama yüzeyi ve gelişmiş ısı yönetim sistemiyle premium kullanım imkânı sunar.",
    basePrice: 849, stock: 6, isFeatured: false, categorySlug: "hmd-apex",
    images: [
      { url: `${R5}/5011/main/c4f3-Hookah-HMD-MAXX-Guard-Titan-Black-0-1-1000x1000.jpg`, altText: "Maxx Guard Titan Black HMD" },
      { url: `${R5}/5011/additional/2304-guard-black-hmd-kozluk-8d7-e9-0-1-1000x1000.jpg`, altText: "Maxx Guard Black Detay" },
    ],
  },
  {
    slug: "maxx-royal-holder-koz-tavasi", name: "Maxx Royal Holder Köz Tavası", sku: "HL-ISI-003",
    shortDescription: "Maxx Royal Holder marka köz tavası.", description: "Maxx Royal Holder Köz Tavası, kömürleri güvenli şekilde taşımanızı ve saklamanızı sağlayan premium paslanmaz çelik aksesuar.",
    basePrice: 299, stock: 12, isFeatured: false, categorySlug: "aks-kozluk-hmd",
    images: [
      { url: `${R5}/5008/main/cff2-maxx-royal-holder-koz-tavasi-c541-d-0-1-1000x1000.jpg`, altText: "Maxx Royal Holder Köz Tavası" },
      { url: `${R5}/5008/additional/917c-maxx-royal-holder-koz-tavasi-62-48e-0-1-1000x1000.jpg`, altText: "Maxx Royal Köz Tavası Detay" },
    ],
  },
  {
    slug: "maxx-royal-tongs-masa", name: "Maxx Royal Tongs Maşa", sku: "HL-ISI-004",
    shortDescription: "Maxx Royal Tongs marka nargile maşası.", description: "Maxx Royal Tongs Maşa, Maxx Royal serisine özel paslanmaz çelik maşa, ergonomik kullanım için tasarlanmış.",
    basePrice: 249, stock: 15, isFeatured: false, categorySlug: "aks-koz-masalari",
    images: [
      { url: `${R5}/5009/main/39aa-maxx-royal-tongs-masa-484-d5-0-1-1000x1000.jpg`, altText: "Maxx Royal Tongs Maşa" },
      { url: `${R5}/5009/additional/e7c3-maxx-royal-tongs-masa-6e-115-0-1-1000x1000.jpg`, altText: "Maxx Royal Tongs Detay" },
    ],
  },
  {
    slug: "darkside-heater-isi-yonetim", name: "Darkside Heater Isı Yönetim Cihazı", sku: "HL-ISI-005",
    shortDescription: "Darkside Heater marka ısı yönetim cihazı.", description: "Darkside Heater, kömür ısısını eşit dağıtarak uzun ve lezzetli nargile seansları sağlayan ısı yönetim cihazıdır.",
    basePrice: 699, stock: 6, isFeatured: false, categorySlug: "hmd-ignis",
    images: [{ url: `${R5}/5024/main/a73a-darkside-heater-0-1-1000x1000.jpg`, altText: "Darkside Heater Isı Yönetim" }],
  },

  // ── Köz Ocakları ──
  {
    slug: "kefo-mini-koz-ocagi", name: "Kefo Mini Köz Ocağı", sku: "HL-KOZ-001",
    shortDescription: "Kefo mini elektrikli köz ocağı.", description: "Kefo Mini Köz Ocağı, kompakt boyutu ve hızlı kömür yakma özelliğiyle pratik kullanım sunan elektrikli köz ocağıdır.",
    basePrice: 449, stock: 10, isFeatured: false, categorySlug: "koz-ocaklari",
    images: [
      { url: `${R4}/4846/main/d27e-kefo-mini-ocak-0-1-1000x1000.jpg`, altText: "Kefo Mini Köz Ocağı" },
      { url: `${R4}/4846/additional/2d62-kefo-mini-ocak-3-0-1-1000x1000.jpg`, altText: "Kefo Mini Ocak Detay" },
    ],
  },
  {
    slug: "kefo-galvaniz-koz-ocagi", name: "Kefo Galvaniz Köz Ocağı", sku: "HL-KOZ-002",
    shortDescription: "Kefo galvaniz kaplı elektrikli köz ocağı.", description: "Kefo Galvaniz Köz Ocağı, galvaniz kaplama yüzeyi ve yüksek ısıtma kapasitesiyle kömürleri hızlıca yakar.",
    basePrice: 599, stock: 8, isFeatured: false, categorySlug: "koz-ocaklari",
    images: [{ url: `${R4}/4847/main/b9cd-kefo-galvaniz-ocak-0-1-1000x1000.jpg`, altText: "Kefo Galvaniz Köz Ocağı" }],
  },
];

async function main() {
  console.log("🌱 Seed başlatılıyor…");

  /* ── Temizlik ── */
  console.log("🧹 Temizleniyor…");
  await prisma.heroSlide.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.product.deleteMany({});
  // Delete categories leaf-first (up to 4 levels)
  for (let i = 0; i < 4; i++) {
    await prisma.category.deleteMany({ where: { other_Category: { none: {} } } });
  }
  await prisma.category.deleteMany({});

  /* ── Admin ── */
  const adminPasswordHash = await bcrypt.hash(
    process.env.ADMIN_INITIAL_PASSWORD ?? "Admin123!",
    12
  );
  const admin = await prisma.user.upsert({
    where:  { email: process.env.ADMIN_EMAIL ?? "admin@halfleaf.com.tr" },
    update: { passwordHash: adminPasswordHash, role: "ADMIN", fullName: "Half Leaf Admin" },
    create: {
      email:        process.env.ADMIN_EMAIL ?? "admin@halfleaf.com.tr",
      fullName:     "Half Leaf Admin",
      passwordHash: adminPasswordHash,
      role:         "ADMIN",
      ageVerified:  true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  /* ── Categories (3 passes: root → level-2 → level-3) ── */
  const categoryMap = new Map<string, string>();

  const rootSlugs = new Set(CATEGORIES.filter(c => !c.parentSlug).map(c => c.slug));
  const level2Slugs = new Set(CATEGORIES.filter(c => c.parentSlug && rootSlugs.has(c.parentSlug)).map(c => c.slug));

  const roots  = CATEGORIES.filter(c => !c.parentSlug);
  const level2 = CATEGORIES.filter(c => c.parentSlug && rootSlugs.has(c.parentSlug!));
  const level3 = CATEGORIES.filter(c => c.parentSlug && level2Slugs.has(c.parentSlug!));

  for (const batch of [roots, level2, level3]) {
    for (const cat of batch) {
      const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : undefined;
      const record = await prisma.category.create({
        data: {
          slug:        cat.slug,
          name:        cat.name,
          description: cat.description,
          imageUrl:    cat.imageUrl,
          sortOrder:   cat.sortOrder,
          parentId:    parentId ?? null,
        },
      });
      categoryMap.set(cat.slug, record.id);
    }
    console.log(`✅ ${batch.length} kategori eklendi`);
  }

  /* ── Products + Inventory ── */
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.categorySlug);
    if (!categoryId) {
      console.warn(`⚠️ Kategori bulunamadı: ${p.categorySlug}`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        slug:             p.slug,
        sku:              p.sku,
        name:             p.name,
        shortDescription: p.shortDescription,
        description:      p.description,
        basePrice:        p.basePrice,
        compareAtPrice:   p.compareAtPrice,
        isFeatured:       p.isFeatured,
        isBestseller:     p.isBestseller ?? false,
        categoryId,
        ProductImage: {
          create: p.images.map((img, i) => ({
            url:       img.url,
            altText:   img.altText,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        },
      },
    });

    await prisma.inventory.create({
      data: { productId: product.id, quantity: p.stock },
    });

    console.log(`✅ Ürün: ${p.name}`);
  }

  /* ── Hero Slides ── */
  const heroSlides = [
    {
      title:     "Özenle Seçilmiş Premium Koleksiyon",
      subtitle:  "Dünyanın önde gelen markalarından özenle derlenen ekipmanlar.",
      eyebrow:   "Yeni Sezon · 2026",
      ctaLabel:  "Koleksiyonu Keşfet",
      ctaHref:   "/urunler",
      sortOrder: 0,
    },
    {
      title:     "Zanaatkâr İşçilik, Modern Tasarım",
      subtitle:  "Pirinç, alüminyum ve doğal taşın buluştuğu premium ekipman seçkisi.",
      eyebrow:   "Premium Seri",
      ctaLabel:  "Takımları İncele",
      ctaHref:   "/urunler?kategori=nargile-takimlari",
      sortOrder: 1,
    },
    {
      title:     "El Yapımı Lüle Koleksiyonu",
      subtitle:  "Seramik ve toprak lülelerden oluşan geniş katalog, özenli seçimler.",
      eyebrow:   "El Yapımı · Sınırlı Stok",
      ctaLabel:  "Lüleleri Keşfet",
      ctaHref:   "/urunler?kategori=luler",
      sortOrder: 2,
    },
  ];

  for (const slide of heroSlides) {
    await prisma.heroSlide.create({ data: slide });
    console.log(`✅ Hero Slide: ${slide.title}`);
  }

  console.log("🍉 Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });