import { ApplicationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { adminStatusUpdateData, publicMediaUpdateForStatus, referenceId, statusNotificationMessage } from "@/lib/admin-status";

const oldProfile = {
  sellerReferenceId: null,
  isFeatured: false,
  approvedAt: null,
  approvedBy: null,
  rejectionReason: null
};

describe("admin status updates", () => {
  it("creates an approval payload with a reference id and approval metadata", () => {
    const now = new Date("2026-07-29T10:00:00.000Z");
    const data = adminStatusUpdateData({
      status: ApplicationStatus.APPROVED,
      isFeatured: true,
      oldProfile,
      adminId: "admin-1",
      now
    });

    expect(data).toMatchObject({
      applicationStatus: ApplicationStatus.APPROVED,
      approvedAt: now,
      approvedBy: "admin-1",
      isFeatured: true
    });
    expect(data.sellerReferenceId).toMatch(/^CMR-2026-\d{4}$/);
  });

  it("keeps existing approval metadata when a non-approval status is applied", () => {
    const approvedAt = new Date("2026-07-20T10:00:00.000Z");
    const data = adminStatusUpdateData({
      status: ApplicationStatus.MORE_INFORMATION_REQUIRED,
      sellerFacingMessage: "Please add clearer product photos.",
      oldProfile: {
        sellerReferenceId: "CMR-2026-1234",
        isFeatured: true,
        approvedAt,
        approvedBy: "admin-1",
        rejectionReason: "Older reason"
      },
      adminId: "admin-2"
    });

    expect(data).toMatchObject({
      applicationStatus: ApplicationStatus.MORE_INFORMATION_REQUIRED,
      sellerReferenceId: "CMR-2026-1234",
      approvedAt,
      approvedBy: "admin-1",
      isFeatured: false,
      rejectionReason: null,
      sellerFacingMessage: "Please add clearer product photos."
    });
  });

  it("stores rejection reasons and toggles media visibility only for approvals", () => {
    const data = adminStatusUpdateData({
      status: ApplicationStatus.REJECTED,
      reason: "Incomplete identity details",
      oldProfile,
      adminId: "admin-1"
    });

    expect(data.rejectionReason).toBe("Incomplete identity details");
    expect(publicMediaUpdateForStatus(ApplicationStatus.APPROVED)).toEqual({ isPublic: true });
    expect(publicMediaUpdateForStatus(ApplicationStatus.REJECTED)).toEqual({ isPublic: false });
  });

  it("clears stale rejection and seller-facing messages on a later decision", () => {
    const data = adminStatusUpdateData({
      status: ApplicationStatus.ARCHIVED,
      oldProfile: { ...oldProfile, rejectionReason: "Previous rejection" },
      adminId: "admin-1"
    });

    expect(data.rejectionReason).toBeNull();
    expect(data.sellerFacingMessage).toBeNull();
  });

  it.each([
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.MORE_INFORMATION_REQUIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.SUSPENDED,
    ApplicationStatus.ARCHIVED
  ])("keeps media private and featured disabled for %s", (status) => {
    const data = adminStatusUpdateData({
      status,
      reason: status === ApplicationStatus.REJECTED ? "Application does not meet the requirements" : undefined,
      isFeatured: true,
      oldProfile: { ...oldProfile, isFeatured: true },
      adminId: "admin-1"
    });

    expect(data.applicationStatus).toBe(status);
    expect(data.isFeatured).toBe(false);
    expect(publicMediaUpdateForStatus(status)).toEqual({ isPublic: false });
  });

  it("formats reference ids and notification messages", () => {
    expect(referenceId(new Date("2026-01-01T00:00:00.000Z"), () => 0)).toBe("CMR-2026-1000");
    expect(statusNotificationMessage(ApplicationStatus.UNDER_REVIEW)).toBe("Your application status is now UNDER_REVIEW.");
    expect(statusNotificationMessage(ApplicationStatus.UNDER_REVIEW, "We are checking your application.")).toBe("We are checking your application.");
  });
});
