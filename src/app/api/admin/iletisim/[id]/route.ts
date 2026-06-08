import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  isRead:    z.boolean().optional(),
  adminNote: z.string().trim().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) return notFound("Mesaj bulunamadı.");
    return ok(msg);
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

  const d = parsed.data;
  if (Object.keys(d).length === 0) return badRequest("Güncelleme alanı belirtilmedi.");

  try {
    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) return notFound("Mesaj bulunamadı.");

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        ...(d.isRead    !== undefined ? { isRead:    d.isRead    } : {}),
        ...(d.adminNote !== undefined ? { adminNote: d.adminNote ?? undefined } : {}),
      },
    });

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};
    if (d.isRead !== undefined && d.isRead !== existing.isRead) {
      before.isRead = existing.isRead; after.isRead = d.isRead;
    }
    if (d.adminNote !== undefined) {
      before.adminNote = existing.adminNote; after.adminNote = d.adminNote;
    }

    if (Object.keys(before).length > 0) {
      await prisma.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action:      "CONTACT_MESSAGE_UPDATED",
          entityType:  "ContactMessage",
          entityId:    id,
          changes:     JSON.parse(JSON.stringify({ before, after })),
          ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
        },
      });
    }

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) return notFound("Mesaj bulunamadı.");

    await prisma.contactMessage.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "CONTACT_MESSAGE_DELETED",
        entityType:  "ContactMessage",
        entityId:    id,
        changes:     JSON.parse(JSON.stringify({ name: existing.name, email: existing.email })),
        ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
