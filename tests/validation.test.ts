import { describe, expect, it } from "vitest";
import { allowedImageTypes, registerSchema, sanitizeFileName, sellerProfileSchema, submitSellerSchema } from "@/lib/validation";

describe("seller registration validation", () => {
  it("requires a strong password and valid seller identity", () => {
    expect(registerSchema.safeParse({ email: "seller@example.com", password: "Weak", fullName: "A", businessName: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "seller@example.com", password: "SellerPass123", fullName: "Valid Seller", businessName: "Valid Trade" }).success).toBe(true);
  });
});

describe("seller application validation", () => {
  it("preserves incomplete identity and malformed website values in a draft", () => {
    const result = sellerProfileSchema.safeParse({
      fullName: "",
      businessName: "",
      websiteUrl: "my-business.example",
      consentReview: false,
      consentPublish: false
    });
    expect(result.success).toBe(true);
  });

  it("rejects incomplete identity and malformed website values on submission", () => {
    const result = submitSellerSchema.partial().safeParse({
      fullName: "",
      businessName: "",
      websiteUrl: "my-business.example"
    });
    expect(result.success).toBe(false);
  });

  it("allows blank optional website and number fields while saving a draft", () => {
    const result = submitSellerSchema.partial().safeParse({
      fullName: "Valid Seller",
      businessName: "Valid Trade",
      websiteUrl: "",
      fundingAmount: ""
    });
    expect(result.success).toBe(true);
  });

  it("requires consent and core public profile fields before submission", () => {
    const result = submitSellerSchema.safeParse({
      fullName: "Valid Seller",
      businessName: "Valid Trade",
      city: "Douala",
      region: "Littoral",
      category: "Agriculture",
      productsOrServices: "Export-ready cocoa and related products",
      businessStage: "Growing",
      shortSummary: "A Cameroon cocoa business preparing for international buyer relationships.",
      journeyStory: "Started from a family farm and built a cooperative model with neighbors, overcoming finance and packaging barriers while creating community income and pursuing export growth.",
      challenges: "Needs packaging finance and quality certification",
      supportNeeded: "Investment and buyer introductions",
      consentReview: true,
      consentPublish: true
    });
    expect(result.success).toBe(true);
  });
});

describe("file upload validation helpers", () => {
  it("sanitizes unsafe file names and allows only image MIME types", () => {
    expect(sanitizeFileName("../../bad file.exe")).toBe("bad-file.exe");
    expect(allowedImageTypes).toContain("image/webp");
    expect(allowedImageTypes.includes("application/x-msdownload" as never)).toBe(false);
  });
});
