import { ApplicationStatus } from "@prisma/client";

export function referenceId(date = new Date(), random = Math.random) {
  const year = date.getFullYear();
  return `CMR-${year}-${Math.floor(1000 + random() * 9000)}`;
}

export function adminStatusUpdateData(input: {
  status: ApplicationStatus;
  isFeatured?: boolean;
  reason?: string;
  sellerFacingMessage?: string;
  oldProfile: {
    sellerReferenceId: string | null;
    isFeatured: boolean;
    approvedAt: Date | null;
    approvedBy: string | null;
    rejectionReason: string | null;
  };
  adminId: string;
  now?: Date;
}) {
  const approved = input.status === ApplicationStatus.APPROVED;
  return {
    applicationStatus: input.status,
    isFeatured: approved ? input.isFeatured ?? input.oldProfile.isFeatured : false,
    sellerReferenceId: approved ? input.oldProfile.sellerReferenceId ?? referenceId(input.now) : input.oldProfile.sellerReferenceId,
    approvedAt: approved ? input.now ?? new Date() : input.oldProfile.approvedAt,
    approvedBy: approved ? input.adminId : input.oldProfile.approvedBy,
    rejectionReason: input.status === ApplicationStatus.REJECTED ? input.reason : input.oldProfile.rejectionReason,
    sellerFacingMessage: input.sellerFacingMessage
  };
}

export function publicMediaUpdateForStatus(status: ApplicationStatus) {
  return { isPublic: status === ApplicationStatus.APPROVED };
}

export function statusNotificationMessage(status: ApplicationStatus, sellerFacingMessage?: string) {
  return sellerFacingMessage ?? `Your application status is now ${status}.`;
}
