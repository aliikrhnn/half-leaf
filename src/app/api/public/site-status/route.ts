import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const s = await prisma.siteSettings.findUnique({
      where:  { id: "site" },
      select: { maintenanceMode: true },
    });
    return NextResponse.json(
      { maintenanceMode: s?.maintenanceMode ?? false },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
    );
  } catch {
    return NextResponse.json(
      { maintenanceMode: false },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
    );
  }
}
