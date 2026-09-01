import { PrismaClient } from "@prisma/client";

/*
 * Bağlantı havuzu ayarları — sunucusuz ortam için.
 *
 * Prisma'nın varsayılan havuz boyutu `cpu_sayısı * 2 + 1`'dir; Vercel'de bu 5
 * bağlantı eder. Havuz dolduğunda sorgular 10 sn kuyrukta bekler ve `P2024`
 * ("Timed out fetching a new connection from the connection pool") ile düşer.
 * Fluid Compute tek bir örnekte çok sayıda isteği EŞZAMANLI işlediğinden, bir
 * tarayıcı/bot dalgası bu 5 bağlantıyı anında tüketiyordu (1 Eylül 2026
 * üretim logları: /urunler, /kategori/*, /urunler/* aynı saniyede hata verdi).
 *
 * Supabase işlem havuzlayıcısı (Supavisor, 6543) istemci bağlantılarını ucuza
 * çoğullar — buradaki sınır Postgres'e değil HAVUZLAYICIYA açılan bağlantı
 * sayısıdır, bu yüzden yükseltmek güvenlidir. Gerekirse ortam değişkeniyle
 * ayarlanabilir.
 */
const CONNECTION_LIMIT = process.env.PRISMA_CONNECTION_LIMIT?.trim() || "12";
const POOL_TIMEOUT = process.env.PRISMA_POOL_TIMEOUT?.trim() || "20";

/**
 * Bağlantı dizesine parametreyi YALNIZCA yoksa ekler; böylece ortam
 * değişkeninde elle verilen bir değer sessizce ezilmez.
 *
 * URL nesnesiyle değil metin olarak birleştirilir: parola alanındaki kaçışlı
 * karakterlerin yeniden kodlanıp bağlantıyı bozma riski olmasın.
 */
function withParam(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
}

/**
 * Bağlantı dizesi havuzlayıcıya mı gidiyor?
 *
 * Yükseltilmiş sınır YALNIZCA havuzlayıcı için güvenlidir. DATABASE_URL bir
 * ortamda doğrudan Postgres'e (5432) bakıyorsa, örnek başına 12 bağlantı
 * eşzamanlı örnek sayısıyla çarpılıp sunucunun `max_connections` sınırını
 * zorlar — yani aynı tükenme sorunu daha yüksek bir sayıda tekrarlanır.
 * Böyle bir durumda Prisma'nın kendi varsayılanına dokunulmaz.
 */
function isPooledUrl(url: string): boolean {
  return /[?&]pgbouncer=true/.test(url) || /:6543(\/|\?|$)/.test(url);
}

function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  if (!isPooledUrl(raw)) return raw;
  return withParam(
    withParam(raw, "connection_limit", CONNECTION_LIMIT),
    "pool_timeout",
    POOL_TIMEOUT,
  );
}

const datasourceUrl = buildDatasourceUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
