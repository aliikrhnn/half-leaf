import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { getAuthUser } from "@/lib/auth/middleware";
import { revokeUserSessions } from "@/lib/auth/session";

/**
 * Çıkış.
 *
 * Çerezi silmek tek başına yetmez: kopyalanmış/çalınmış bir token çerez
 * silindikten sonra da geçerli kalırdı (7 gün). Bu yüzden çıkışta kullanıcının
 * `tokenVersion` değeri artırılır ve dolaşımdaki tüm token'ları anında
 * geçersizleşir.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user) {
    try {
      await revokeUserSessions(user.userId);
    } catch {
      // İptal edilemese bile çerez yine de silinir.
    }
  }

  const res = ok({ loggedOut: true });
  res.cookies.set("hl-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
