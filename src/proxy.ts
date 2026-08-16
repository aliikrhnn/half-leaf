import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

function passThrough(req: NextRequest): NextResponse {
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
}

/* ── Bakım modu ───────────────────────────────────────────────────────────────
 * Ayar yönetim panelinde vardı ama hiçbir kod okumuyordu: açıldığında site
 * açık kalmaya devam ediyordu. Burada uygulanıyor. Her istekte veritabanına
 * gidilmemesi için durum örnek içinde 30 sn önbelleklenir.
 */
const MAINTENANCE_TTL_MS = 30_000;
let maintenanceCache: { value: boolean; at: number } | null = null;

async function isMaintenanceMode(req: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.at < MAINTENANCE_TTL_MS) {
    return maintenanceCache.value;
  }
  try {
    const res = await fetch(new URL("/api/public/site-status", req.nextUrl.origin), {
      cache: "no-store",
    });
    const data = (await res.json()) as { maintenanceMode?: boolean };
    const value = Boolean(data.maintenanceMode);
    maintenanceCache = { value, at: now };
    return value;
  } catch {
    // Durum okunamıyorsa siteyi kapatma — yanlış pozitif satış kaybettirir.
    maintenanceCache = { value: false, at: now };
    return false;
  }
}

/** Bakım modunda kapatılmayan yollar. */
function isMaintenanceExempt(pathname: string): boolean {
  return (
    pathname === "/bakim" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/")
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ── Skip for static assets ── */
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  /* ── Maintenance mode ── */
  if (!isMaintenanceExempt(pathname) && (await isMaintenanceMode(req))) {
    return NextResponse.redirect(new URL("/bakim", req.url));
  }

  /* ── Admin protection ──
   * Burada yalnızca JWT imzası doğrulanır (middleware'de veritabanına
   * gidilmez). Asıl yetki kontrolü `requireAdmin` ile API katmanındadır ve
   * orada rol + hesap durumu veritabanından teyit edilir; bu yüzden eski bir
   * token'la panel kabuğu açılsa bile hiçbir veri gelmez. */
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return passThrough(req);

    const token = req.cookies.get("hl-token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

    try {
      const payload = await verifyToken(token);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return passThrough(req);
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  /* ── Hesabım protection ── */
  if (pathname.startsWith("/hesabim")) {
    const token = req.cookies.get("hl-token")?.value;

    if (!token) {
      const url = new URL("/giris", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    try {
      await verifyToken(token);
      return NextResponse.next();
    } catch {
      const url = new URL("/giris", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // x-pathname her istekte set edilir: sunucu bileşenleri (ör. bakım modu
  // kontrolü yapan RootLayout) aktif yolu bu başlıktan okur.
  return passThrough(req);
}

export const config = {
  /**
   * `api/` hariç tutuluyor. İki sebep:
   *  1) Proxy API yollarında zaten hiçbir şey yapmıyordu — bakım modu muaf
   *     (`isMaintenanceExempt`), admin dalı `/admin` ile başlayanlara bakıyor
   *     (`/api/admin/...` ona girmiyor, yetki `requireAdmin`'de), geriye
   *     yalnızca hiçbir API tüketicisinin okumadığı `x-pathname` kalıyordu.
   *  2) Gövdeyi proxy üzerinden geçirmek istekleri 10 MB'da kesiyordu; video
   *     yükleme bu yüzden bozuk dosya kaydediyordu.
   */
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
