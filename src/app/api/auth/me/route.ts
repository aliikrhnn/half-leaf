import { NextRequest } from "next/server";
import { getUserById } from "@/lib/services/auth.service";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { getAuthUser } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const user = await getUserById(authUser.userId);
    if (!user) return unauthorized();

    return ok(user);
  } catch {
    return serverError();
  }
}
