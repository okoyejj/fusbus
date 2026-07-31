import { ApplicationStatus, Prisma } from "@prisma/client";

type SellerProfileFormData = {
  fullName: string;
  businessName: string;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  city?: string | null;
  region?: string | null;
  category?: string | null;
  productsOrServices?: string | null;
  yearsInBusiness?: number | null;
  employeeCount?: number | null;
  businessStage?: string | null;
  websiteUrl?: string | null;
  socialLinks?: string | null;
  shortSummary?: string | null;
  journeyStory?: string | null;
  challenges?: string | null;
  achievements?: string | null;
  communityImpact?: string | null;
  futureGoals?: string | null;
  supportNeeded?: string | null;
  fundingAmount?: number | null;
  useOfFunds?: string | null;
  consentReview: boolean;
  consentPublish: boolean;
};

export function sellerProfilePersistenceData(data: SellerProfileFormData) {
  return {
    ...data,
    websiteUrl: data.websiteUrl || null,
    socialLinks: data.socialLinks ? { raw: data.socialLinks } : Prisma.JsonNull
  };
}

export function sellerProfileUpsertArgs(userId: string, data: SellerProfileFormData, submit: boolean, previousStatus?: ApplicationStatus, previousSubmittedAt?: Date | null) {
  const persisted = sellerProfilePersistenceData(data);
  const submittedAt = submit ? new Date() : previousSubmittedAt ?? null;
  const preserveReviewStatus = previousStatus === ApplicationStatus.UNDER_REVIEW
    || previousStatus === ApplicationStatus.APPROVED
    || previousStatus === ApplicationStatus.SUSPENDED
    || previousStatus === ApplicationStatus.ARCHIVED;
  const status = submit && !preserveReviewStatus
    ? ApplicationStatus.SUBMITTED
    : previousStatus ?? ApplicationStatus.DRAFT;

  return {
    where: { userId },
    create: {
      ...persisted,
      user: { connect: { id: userId } },
      applicationStatus: status,
      submittedAt
    },
    update: {
      ...persisted,
      applicationStatus: status,
      submittedAt
    }
  };
}
