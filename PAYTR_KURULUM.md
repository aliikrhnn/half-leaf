# PayTR iFrame API Entegrasyonu — Kurulum Rehberi

Half Leaf mağazasının kredi/banka kartı ödemeleri **PayTR iFrame API** ile entegre
edilmiştir. Bu doküman, canlıya almak için yapılması gereken adımları içerir.

---

## 1. Ortam Değişkenleri

PayTR Mağaza Paneli → **BİLGİ** sayfasından (Ana Kullanıcı / Teknik Sorumlu görebilir)
aşağıdaki üç değeri alıp ortam değişkeni olarak tanımlayın:

| Değişken | Açıklama |
|----------|----------|
| `PAYTR_MERCHANT_ID` | Mağaza numarası |
| `PAYTR_MERCHANT_KEY` | Mağaza parolası |
| `PAYTR_MERCHANT_SALT` | Mağaza gizli anahtarı |
| `PAYTR_TEST_MODE` | `1` = test (tahsilat yapılmaz), `0` = gerçek tahsilat |
| `PAYTR_NO_INSTALLMENT` | `1` = taksit gizle (yalnız tek çekim), `0` = taksite izin ver |
| `PAYTR_MAX_INSTALLMENT` | Gösterilecek en yüksek taksit (`0` = sınırsız) |

> **Güvenlik:** Bu değerler **gizlidir**, asla istemci (tarayıcı) koduna konmaz.
> Yalnızca `.env` / Vercel Environment Variables içinde tutulur.

Lokal geliştirme için `.env`, örnek için `.env.example` güncellenmiştir.
Vercel'de: **Project → Settings → Environment Variables** altına ekleyin.

---

## 2. Bildirim URL (ÇOK ÖNEMLİ)

PayTR ödeme sonucunu (başarılı/başarısız) sunucumuza **arka planda** POST eder.
Bu adres olmadan ödemeler tamamlanmaz ve para hesabınıza aktarılmaz.

PayTR Mağaza Paneli → **Ayarlar → Bildirim URL** alanına şunu girin:

```
https://halfleafstore.com/api/odeme/paytr/callback
```

- Siteniz SSL (https) kullandığı için protokolü **HTTPS** seçin.
- Bu adrese giriş kısıtlaması / auth konulmamıştır (PayTR erişebilmeli).
- Uç nokta yalnızca düz `OK` döner; hash doğrulaması ve idempotency uygular.

> `NEXT_PUBLIC_SITE_URL` değerinin canlıda **`https://halfleafstore.com`** olduğundan
> emin olun (yönlendirme URL'leri buradan üretilir).

---

## 3. Ödeme Akışı (özet)

1. Müşteri sepet → **Teslimat** → **Ödeme** adımında "Kredi / Banka Kartı" seçer.
2. "Güvenli Ödemeye Geç" → `POST /api/siparis` siparişi oluşturur (stok rezerve edilir,
   `Payment(provider=paytr, status=BEKLIYOR)`), `/odeme/paytr/[orderNumber]` sayfasına yönlenir.
3. Sayfa sunucu tarafında PayTR'dan **iframe token** alır (1. ADIM) ve güvenli ödeme
   formunu iframe içinde açar.
4. Müşteri kartla öder. PayTR sonucu **Bildirim URL**'ye POST eder (2. ADIM):
   - **success** → `Payment=ODENDI`, `Order=ONAYLANDI`, müşteri onay sayfasına döner.
   - **failed** → `Payment=BASARISIZ`, `Order=IPTAL_EDILDI`, **stok ve kupon geri yüklenir**,
     müşteri `/odeme/hata` sayfasına döner (sepeti korunur, tekrar deneyebilir).
5. Onay sayfası (`/siparis-tamamlandi`) ödeme henüz onaylanmadıysa otomatik tazelenir.

> **Not:** `merchant_ok_url`'e PayTR veri POST etmez; sipariş onayı **yalnızca** Bildirim
> URL üzerinden yapılır (resmî dokümana uygun). Onay sayfası bu yüzden sadece görseldir.

Havale/EFT yöntemi PayTR'dan bağımsızdır; mevcut manuel akış korunmuştur.

### Mutabakat (reconciliation) cron'u

Ağ/yoğunluk nedeniyle bir **Bildirim kaybolursa**, 30 dakikadan eski hâlâ "BEKLIYOR"
PayTR siparişleri için bir güvenlik ağı çalışır:
`/api/cron/reconcile-payments` (Vercel cron, 15 dk'da bir) PayTR **Durum Sorgu API**'si ile
durumu sorgular; ödeme başarılıysa siparişi **onaylar** (kayıp bildirimi kurtarır),
başarılı ödeme yoksa siparişi **iptal eder ve stoğu/kuponu geri yükler**.

Bunun için `CRON_SECRET` ortam değişkeni tanımlı olmalıdır (Vercel cron `Authorization:
Bearer <CRON_SECRET>` gönderir). Tanımlı değilse uç nokta 401 döner.

---

## 4. Test Süreci

1. `PAYTR_TEST_MODE=1` iken bir sipariş oluşturup kartla ödeme deneyin
   (PayTR test kartları panelde "Örnek Kart Bilgileri" altında).
2. PayTR Mağaza Paneli → **İşlemler** sayfasında işlemin **"Başarılı"** göründüğünü doğrulayın.
   - "Devam Ediyor" görünüyorsa Bildirim URL'den `OK` yanıtı alınamıyor demektir;
     "Detay" linkinden dönen yanıtı kontrol edin.
3. Başarısız senaryoyu da test edin (ödemeyi yarıda bırakma) → `/odeme/hata` sayfasına
   dönmeli, stok geri yüklenmeli.

---

## 5. Canlıya Geçiş

- `PAYTR_TEST_MODE=0` yapın (gerçek tahsilat).
- Bildirim URL'nin canlı domain ile https olarak tanımlı olduğunu doğrulayın.
- `NEXT_PUBLIC_SITE_URL`'nin canlı https adres olduğunu doğrulayın.

---

## 6. İade (Refund)

Admin → **Sipariş Detayı → Ödeme Bilgisi** kartında, PayTR ile ödenmiş siparişler için
**"İade Et"** kontrolü bulunur:

- Tutar boş → **tam iade** (`Payment=IADE_EDILDI`, `Order=IPTAL_EDILDI`).
- Tutar girilirse → **kısmi iade** (`Payment=KISMI_IADE`).

İade, PayTR İade API'si (`/odeme/iade`) üzerinden gerçekleşir.

---

## 7. İlgili Dosyalar

| Dosya | Görev |
|-------|-------|
| `src/lib/payment/paytr.ts` | Çekirdek: token/hash, sepet, iframe token, callback doğrulama, iade, durum sorgu |
| `src/app/api/odeme/paytr/callback/route.ts` | Bildirim URL (2. ADIM) |
| `src/app/odeme/paytr/[orderNumber]/page.tsx` | iframe ödeme sayfası (1. ADIM) |
| `src/app/odeme/paytr/[orderNumber]/PaytrFrame.tsx` | iframe + iframeResizer (client) |
| `src/app/odeme/hata/page.tsx` | Başarısız ödeme sayfası (`merchant_fail_url`) |
| `src/app/siparis-tamamlandi/*` | Onay sayfası (`merchant_ok_url`) + sepet temizleme |
| `src/app/api/siparis/route.ts` | Sipariş oluşturma (provider=paytr) |
| `src/app/api/admin/odeme/paytr/iade/route.ts` | Admin iade API |
| `public/payment/paytr-logo-*.svg` | PayTR logoları |
