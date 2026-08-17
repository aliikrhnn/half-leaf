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

> **ÖNEMLİ:** Test ekranını (PayTR "TEST MODU" sarı uyarısı / örnek kart ekranı)
> belirleyen tek şey **ortam değişkenidir** — kodda sabit test kodu YOKTUR.
> Kod, güvenlik gereği `PAYTR_TEST_MODE` açıkça `0` değilse test moduna düşer.
> **Canlı site Vercel'in env değişkenlerini okur; yereldeki `.env` canlıyı etkilemez.**

**Vercel'de (Project → Settings → Environment Variables, Production):**

1. `PAYTR_TEST_MODE = 0`  ← gerçek tahsilat (test ekranını kapatır)
2. `NEXT_PUBLIC_SITE_URL = https://halfleafstore.com`  ← **https** (yönlendirme URL'leri buradan üretilir; `NEXT_PUBLIC_` değişkeni build'e gömülür)
3. `PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT`'ın **canlı** değerlerle dolu olduğunu doğrulayın (PayTR canlıya alırken yeni değer verdiyse güncelleyin).
4. Değişiklikten sonra **yeniden deploy** edin (Deployments → son deploy → Redeploy). Env değişikliği ancak yeni deploy ile yürürlüğe girer.

**PayTR Mağaza Paneli'nde:**

5. **Ayarlar → Bildirim URL** = `https://halfleafstore.com/api/odeme/paytr/callback` (https).
6. Mağaza durumunun PayTR tarafında **canlı/onaylı** olduğunu doğrulayın. Hesap hâlâ onay bekliyorsa `test_mode=0` olsa bile test ekranı görünebilir (bu PayTR tarafıdır).

Yerel geliştirme için `.env` zaten `PAYTR_TEST_MODE=0` + https olacak şekilde güncellendi.

> **Bildirim URL artık kritik.** Sipariş onay e-postası kart ödemelerinde SADECE
> buradan tetikleniyor (sipariş oluşturulurken değil). Bildirim URL yanlışsa
> müşteri ödemesini yapar ama onay maili hiç gitmez. Yedek olarak
> `/api/cron/reconcile-payments` mutabakat cron'u aynı maili telafi eder —
> `CRON_SECRET` tanımlı değilse o da çalışmaz.

---

## 5.1 · Ödeme dönüş köprüsü (`/odeme/donus`)

PayTR iFrame API'sinde ödeme bitince `merchant_ok_url` / `merchant_fail_url`
**iframe'in içinde** açılır. Sitenin tamamı `X-Frame-Options: DENY` +
`frame-ancestors 'none'` ile korunduğu için sonuç sayfası orada çizilemiyor ve
müşteri kart bilgisini girdikten sonra **beyaz ekranda** kalıyordu.

Bu yüzden PayTR'a artık sonuç sayfaları doğrudan verilmez; araya `/odeme/donus`
köprüsü girer:

- Çerçevelenmesine izin verilen **tek** adrestir (`frame-ancestors https://www.paytr.com`,
  `X-Frame-Options` göndermez — bkz. `next.config.ts`).
- Tek işi üst pencereyi `/siparis-tamamlandi` ya da `/odeme/hata` adresine taşımaktır.
- Hedef adresi **sunucuda** kurar; dışarıdan tam URL kabul etmez (açık yönlendirme koruması).

Ayrıca `/odeme/paytr/*` yolunda `frame-src 'self' https:` uygulanır: 3D Secure
adımında iframe kartın bankasının adresine gidiyor, katı liste bunu engelliyordu.

**Bu üç başlık kuralına dokunulursa** (`next.config.ts` → `headers()`), üç yolu da
tekrar ölçün — genel kural negatif lookahead ile yazılıdır ve sessizce eşleşmezse
tüm site CSP'siz kalır:

```bash
curl -sI https://halfleafstore.com/            | grep -iE "x-frame-options|content-security"
curl -sI https://halfleafstore.com/odeme/donus | grep -iE "x-frame-options|content-security"
```

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
