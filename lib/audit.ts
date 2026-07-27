import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/auth";

export async function audit(request: NextRequest, input: {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues as never,
      newValues: input.newValues as never,
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? "unknown"
    }
  });
}
