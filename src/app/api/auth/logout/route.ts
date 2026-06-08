import { ok } from "@/lib/api/response";

export async function POST() {
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
