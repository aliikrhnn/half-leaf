# Video Reels — ürün videoları

Ana sayfadaki **"Hangi model sana göre?"** karuselinin videoları bu klasörde durur.
Bileşen: `src/components/sections/VideoReels.tsx`

Dosya yoksa kart bozulmaz — marka/model yazan bir placeholder gösterir ve dosya
eklendiği anda otomatik olarak videoya döner. Yani videoları teker teker
ekleyebilirsiniz.

## Beklenen dosya adları

`VideoReels.tsx` içindeki `REELS` dizisiyle birebir eşleşmelidir:

| Dosya | Ürün |
|---|---|
| `alpha-oro-prime.mp4` | Alpha Hookah · Oro Prime |
| `xhoob-enzoy-wood.mp4` | Xhoob · Enzoy Wood |
| `kbro-gold.mp4` | K-Bro · Gold |
| `union-fibonacci.mp4` | Union Hookah · Fibonacci Hybrid |
| `quasar-blackhole.mp4` | Quasar · Arguilé Black Hole |
| `maklaud-treada.mp4` | Maklaud · Treada |

Ürün eklemek/çıkarmak için `REELS` dizisini düzenleyin; dosya adı, ürün adı,
fiyat ve `/urunler/...` bağlantısı hep orada.

## Video özellikleri

| | |
|---|---|
| **En-boy** | Dikey **9:16** (Instagram Reels / TikTok formatı) |
| **Çözünürlük** | ~**720 × 1280** (1080×1920 de olur, dosya büyür) |
| **Süre** | **10–20 saniye** |
| **Boyut** | **8 MB altı** — üstü mobilde yavaş açılır |
| **Format** | MP4 (H.264 + AAC) |
| **Ses** | Videolar sessiz başlar; kullanıcı hoparlör düğmesiyle açar |

## Boyut düşürme (ffmpeg)

```bash
ffmpeg -i ham-video.mov \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  -c:v libx264 -crf 26 -preset slow -profile:v main \
  -c:a aac -b:a 96k -movflags +faststart \
  alpha-oro-prime.mp4
```

`-movflags +faststart` önemli: videonun tamamı inmeden oynamaya başlar.
Dosya hâlâ büyükse `-crf` değerini artırın (26 → 30 daha küçük, biraz daha düşük kalite).

## Performans notu

Videolar `preload="none"` ile tanımlıdır ve yalnızca karta ekranda görününce
(IntersectionObserver, %35 eşik) indirilir. Yani 6 video birden yüklenmez;
ana sayfanın açılış hızını etkilemez.
