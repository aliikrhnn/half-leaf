import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

function passThrough(req: NextRequest): NextResponse {
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
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

  /* ── Admin protection ── */
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
