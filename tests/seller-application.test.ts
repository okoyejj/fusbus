import { ApplicationStatus, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { sellerProfilePersistenceData, sellerProfileUpsertArgs } from "@/lib/seller-application";

const draft = {
  fullName: "Valid Seller",
  businessName: "Valid Trade",
  phoneNumber: "",
  whatsappNumber: null,
  city: "Douala",
  region: "Littoral",
  category: "Agriculture",
  productsOrServices: "Cocoa products",
  yearsInBusiness: 3,
  employeeCount: 4,
  businessStage: "Growing",
  websiteUrl: "",
  socialLinks: "",
  shortSummary: "Export-ready cocoa",
  journeyStory: "Long story",
  challenges: "Packaging",
  achievements: null,
  communityImpact: null,
  futureGoals: null,
  supportNeeded: "Investment",
  fundingAmount: 5000,
  useOfFunds: "Packaging",
  consentReview: true,
  consentPublish: false
};

describe("seller application persistence", () => {
  it("normalizes blank optional fields before saving", () => {
    const data = sellerProfilePersistenceData({ ...draft, websiteUrl: "", socialLinks: "" });
    expect(data.websiteUrl).toBeNull();
    expect(data.socialLinks).toBe(Prisma.JsonNull);
  });

  it("stores social links as structured json when provided", () => {
    const data = sellerProfilePersistenceData({ ...draft, socialLinks: "https://example.com/profile" });
    expect(data.socialLinks).toEqual({ raw: "https://example.com/profile" });
  });

  it("builds an upsert that creates missing draft profiles", () => {
    const args = sellerProfileUpsertArgs("user-1", draft, false);
    expect(args.where).toEqual({ userId: "user-1" });
    expect(args.create.user).toEqual({ connect: { id: "user-1" } });
    expect(args.create.applicationStatus).toBe(ApplicationStatus.DRAFT);
    expect(args.create.submittedAt).toBeNull();
  });

  it("preserves existing status when saving a draft and submits when requested", () => {
    const submittedAt = new Date("2026-07-20T10:00:00.000Z");
    const draftArgs = sellerProfileUpsertArgs("user-1", draft, false, ApplicationStatus.MORE_INFORMATION_REQUIRED, submittedAt);
    expect(draftArgs.update.applicationStatus).toBe(ApplicationStatus.MORE_INFORMATION_REQUIRED);
    expect(draftArgs.update.submittedAt).toBe(submittedAt);

    const submitArgs = sellerProfileUpsertArgs("user-1", draft, true, ApplicationStatus.DRAFT, null);
    expect(submitArgs.update.applicationStatus).toBe(ApplicationStatus.SUBMITTED);
    expect(submitArgs.update.submittedAt).toBeInstanceOf(Date);
  });
});
