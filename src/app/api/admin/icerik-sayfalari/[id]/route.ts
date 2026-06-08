import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  title:       z.string().trim().min(1).optional(),
  content:     z.string().optional(),
  isPublished: z.boolean().optional(),
  version:     z.string().trim().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const page = await prisma.legalPage.findUnique({ where: { id } });
    if (!page) return notFound("Sayfa bulunamadı.");
    return ok(page);
  } catch {
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const { title, content, isPublished, version } = parsed.data;
  if (title === undefined && content === undefined && isPublished === undefined && version === undefined) {
    return badRequest("En az bir alan gerekli.");
  }

  try {
    const existing = await prisma.legalPage.findUnique({ where: { id } });
    if (!existing) return notFound("Sayfa bulunamadı.");

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};

    if (title       !== undefined && title       !== existing.title)       { before.title       = existing.title;       after.title       = title;       }
    if (content     !== undefined && content     !== existing.content)     { before.content     = existing.content;     after.content     = content;     }
    if (version     !== undefined && version     !== existing.version)     { before.version     = existing.version;     after.version     = version;     }
    if (isPublished !== undefined && isPublished !== existing.isPublished) { before.isPublished = existing.isPublished; after.isPublished = isPublished; }

    type PageUpdate = {
      title?:       string;
      content?:     string;
      version?:     string;
      isPublished?: boolean;
      publishedAt?: Date | null;
    };
    const updateData: PageUpdate = {};
    if (title       !== undefined) updateData.title       = title;
    if (content     !== undefined) updateData.content     = content;
    if (version     !== undefined) updateData.version     = version;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existing.publishedAt) updateData.publishedAt = new Date();
      if (!isPublished)                         updateData.publishedAt = null;
    }

    let updated: typeof existing | null = existing;

    await prisma.$transaction(async (tx) => {
      updated = await tx.legalPage.update({ where: { id }, data: updateData });

      if (Object.keys(before).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "LEGAL_PAGE_UPDATED",
            entityType:  "LegalPage",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}
