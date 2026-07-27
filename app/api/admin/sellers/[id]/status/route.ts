import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { adminStatusSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { requireSameOrigin } from "@/lib/security";

function referenceId() {
  const year = new Date().getFullYear();
  return `CMR-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const admin = await requireUser(UserRole.ADMIN);
  const params = await context.params;
  const parsed = adminStatusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.status === "REJECTED" && !parsed.data.reason) {
    return NextResponse.json({ error: "Rejection requires an internal reason" }, { status: 400 });
  }
  const oldProfile = await prisma.sellerProfile.findUniqueOrThrow({ where: { id: params.id } });
  const approved = parsed.data.status === "APPROVED";
  const profile = await prisma.sellerProfile.update({
    where: { id: params.id },
    data: {
      applicationStatus: parsed.data.status as ApplicationStatus,
      isFeatured: parsed.data.isFeatured ?? oldProfile.isFeatured,
      sellerReferenceId: approved ? oldProfile.sellerReferenceId ?? referenceId() : oldProfile.sellerReferenceId,
      approvedAt: approved ? new Date() : oldProfile.approvedAt,
      approvedBy: approved ? admin.id : oldProfile.approvedBy,
      rejectionReason: parsed.data.status === "REJECTED" ? parsed.data.reason : oldProfile.rejectionReason,
      sellerFacingMessage: parsed.data.sellerFacingMessage
    }
  });
  await audit(request, { actorUserId: admin.id, action: `ADMIN_STATUS_${parsed.data.status}`, entityType: "SellerProfile", entityId: profile.id, oldValues: oldProfile, newValues: profile });
  await queueNotification({
    userId: profile.userId,
    type: `SELLER_${parsed.data.status}`,
    subject: `Application ${parsed.data.status.toLowerCase().replaceAll("_", " ")}`,
    message: parsed.data.sellerFacingMessage ?? `Your application status is now ${parsed.data.status}.`
  });
  return NextResponse.json({ profile });
}
