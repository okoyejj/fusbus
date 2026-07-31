import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { adminStatusSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { requireSameOrigin } from "@/lib/security";
import { adminStatusUpdateData, publicMediaUpdateForStatus, statusNotificationMessage } from "@/lib/admin-status";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const admin = await requireUser(UserRole.ADMIN);
  const params = await context.params;
  const parsed = adminStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message = Object.values(errors).flat().find(Boolean) ?? "Check the status update fields and try again.";
    return NextResponse.json({ error: message, fieldErrors: errors }, { status: 400 });
  }
  if (parsed.data.status === "REJECTED" && !parsed.data.reason) {
    return NextResponse.json({ error: "Rejection requires an internal reason" }, { status: 400 });
  }
  const oldProfile = await prisma.sellerProfile.findUnique({ where: { id: params.id } });
  if (!oldProfile) return NextResponse.json({ error: "Seller application not found" }, { status: 404 });

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const updated = await tx.sellerProfile.update({
        where: { id: params.id },
        data: adminStatusUpdateData({
          status: parsed.data.status as ApplicationStatus,
          isFeatured: parsed.data.isFeatured,
          reason: parsed.data.reason,
          sellerFacingMessage: parsed.data.sellerFacingMessage,
          oldProfile,
          adminId: admin.id
        })
      });
      await tx.sellerMedia.updateMany({
        where: { sellerProfileId: updated.id },
        data: publicMediaUpdateForStatus(updated.applicationStatus)
      });
      return updated;
    });

    audit(request, { actorUserId: admin.id, action: `ADMIN_STATUS_${parsed.data.status}`, entityType: "SellerProfile", entityId: profile.id, oldValues: oldProfile, newValues: profile }).catch(console.error);
    queueNotification({
      userId: profile.userId,
      type: `SELLER_${parsed.data.status}`,
      subject: `Application ${parsed.data.status.toLowerCase().replaceAll("_", " ")}`,
      message: statusNotificationMessage(parsed.data.status as ApplicationStatus, parsed.data.sellerFacingMessage)
    }).catch(console.error);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update seller application status" }, { status: 500 });
  }
}
