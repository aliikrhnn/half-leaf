import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

function passThrough(req: NextRequest): NextResponse {
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
}

/* ── Maintenance cache (5 dakikada bir yenile) ── */
const MAINTENANCE_TTL_MS = 300_000; // 5 dakika

let _maintenanceCache: { value: boolean; ts: number } | null = null;
let _maintenanceFetch: Promise<boolean> | null = null;

async function checkMaintenanceMode(origin: string): Promise<boolean> {
  const now = Date.now();
  if (_maintenanceCache && now - _maintenanceCache.ts < MAINTENANCE_TTL_MS) {
    return _maintenanceCache.value;
  }
  // Eş zamanlı istekleri tek bir fetch'e indir
  if (!_maintenanceFetch) {
    _maintenanceFetch = (async () => {
      try {
        const res = await fetch(`${origin}/api/public/site-status`);
        if (res.ok) {
          const data = await res.json() as { maintenanceMode: boolean };
          _maintenanceCache = { value: data.maintenanceMode, ts: Date.now() };
          return data.maintenanceMode;
        }
      } catch {
        /* fail open */
      }
      return _maintenanceCache?.value ?? false;
    })().finally(() => {
      _maintenanceFetch = null;
    });
  }
  return _maintenanceFetch;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ── Skip middleware for static assets ── */
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  /* ── Maintenance mode (not for admin, api/admin, api/auth, api/public, /bakim) ── */
  const isAdminPath    = pathname.startsWith("/admin");
  const isAdminApi     = pathname.startsWith("/api/admin");
  const isAuthApi      = pathname.startsWith("/api/auth");
  const isPublicApi    = pathname.startsWith("/api/public");
  const isBakim        = pathname === "/bakim";

  if (!isAdminPath && !isAdminApi && !isAuthApi && !isPublicApi && !isBakim) {
    const inMaintenance = await checkMaintenanceMode(req.nextUrl.origin);
    if (inMaintenance) {
      return NextResponse.redirect(new URL("/bakim", req.url));
    }
  }

  /* ── Admin protection ── */
  if (isAdminPath) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
