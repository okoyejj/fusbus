import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const admin = await requireUser(UserRole.ADMIN);
  const body = await request.json() as { relatedEntityType?: string; relatedEntityId?: string; note?: string };
  if (!body.relatedEntityType || !body.relatedEntityId || !body.note) return NextResponse.json({ error: "Missing note fields" }, { status: 400 });
  const note = await prisma.adminNote.create({
    data: {
      adminUserId: admin.id,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
      note: body.note.slice(0, 4000)
    }
  });
  return NextResponse.json({ note });
}
