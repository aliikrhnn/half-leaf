# Video Reels — ürün videoları

Ana sayfadaki **"Hangi model sana göre?"** karuseli.

Videolar **admin panelinden** yüklenir: `/admin/reels` → ilgili satırdaki video
alanına dosyayı sürükleyin. Dosya Supabase Storage'a (`halfleaf-uploads/reels/`)
gider, URL'i `ProductReel.videoUrl` alanına yazılır; ürün adı, marka ve fiyat
zaten veritabanından okunur.

Bu klasör yalnızca elle konulan yedek dosyalar içindir — normal akışta boş kalır.

Videosu olmayan kart bozulmaz: marka/model yazan bir placeholder gösterir ve
video eklendiği anda otomatik olarak videoya döner. Yani reelleri teker teker
tamamlayabilirsiniz.

## Video özellikleri

| | |
|---|---|
| **En-boy** | Dikey **9:16** (Instagram Reels / TikTok formatı) |
| **Çözünürlük** | ~**720 × 1280** (1080×1920 de olur, dosya büyür) |
| **Süre** | **10–20 saniye** |
| **Boyut** | **En fazla 20 MB** — 8 MB altı mobilde belirgin şekilde hızlı açılır |
| **Format** | MP4 (H.264 + AAC), WEBM veya MOV |
| **Ses** | Videolar sessiz başlar; kullanıcı hoparlör düğmesiyle açar |

20 MB sınırı üç yerde tanımlı ve üçü de aynı kalmalı:
`src/lib/upload/reel-video.ts` (sunucu) · `VideoUploadField.tsx` (istemci) ·
Supabase bucket sınırı (25 MB, pay bırakmak için).

## Video neden Vercel'den geçmiyor

Vercel istek gövdelerini **4.5 MB**'ta `FUNCTION_PAYLOAD_TOO_LARGE` ile kesiyor
ve bu sınır fonksiyon çalışmadan önce devreye girdiği için kodla yükseltilemiyor.
Bu yüzden akış üç adımlı:

1. `POST /api/admin/reels/upload-url` — sunucu boyutu/MIME'ı doğrular, depolama
   yolunu **kendisi** üretir (uzantı dosya adından değil MIME'dan gelir) ve
   imzalı bir yükleme adresi döndürür.
2. Tarayıcı dosyayı **doğrudan** Supabase'e yükler — Vercel'e hiç uğramaz.
3. `POST /api/admin/reels/upload-verify` — sunucu ilk 12 baytı Range isteğiyle
   çekip boyutu ve video imzasını doğrular; geçersizse nesneyi siler.

## Boyut düşürme (ffmpeg)

```bash
ffmpeg -i ham-video.mov \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  -c:v libx264 -crf 26 -preset slow -profile:v main \
  -c:a aac -b:a 96k -movflags +faststart \
  reel.mp4
```

`-movflags +faststart` önemli: videonun tamamı inmeden oynamaya başlar.
Dosya hâlâ büyükse `-crf` değerini artırın (26 → 30 daha küçük, biraz daha düşük kalite).

## Performans notu

Videolar `preload="none"` ile tanımlıdır ve yalnızca kart ekranda görününce
(IntersectionObserver, %35 eşik) indirilir. Yani tüm videolar birden yüklenmez;
ana sayfanın açılış hızını etkilemez.
