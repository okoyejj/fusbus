import { z } from "zod";

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);
const optionalText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());
const optionalNumber = (max: number) => z.preprocess(blankToNull, z.coerce.number().int().min(0).max(max).nullable().optional());
const optionalMoney = z.preprocess(blankToNull, z.coerce.number().nonnegative().nullable().optional());
const optionalUrl = z.preprocess(blankToNull, z.string().trim().url().nullable().optional());

export const businessStages = [
  "Idea or concept",
  "Startup",
  "Early stage",
  "Growing",
  "Established",
  "Scaling",
  "Export-ready"
] as const;

export const businessCategories = [
  "Agriculture",
  "Beauty and Wellness",
  "Creative Goods",
  "Digital Services",
  "Education and Training",
  "Fashion and Textiles",
  "Food Processing",
  "Health and Care",
  "Hospitality and Tourism",
  "Manufacturing",
  "Other",
  "Professional Services",
  "Retail and Trade",
  "Technology",
  "Transport and Logistics"
] as const;

const optionalBusinessStage = z.preprocess(blankToNull, z.enum(businessStages).nullable().optional());
const optionalBusinessCategory = z.preprocess(blankToNull, z.enum(businessCategories).nullable().optional());

export const passwordSchema = z
  .string()
  .min(10)
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a number");

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().min(2).max(120),
  businessName: z.string().min(2).max(140)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const sellerProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  businessName: z.string().trim().min(2).max(140),
  phoneNumber: optionalText(40),
  whatsappNumber: optionalText(40),
  city: optionalText(80),
  region: optionalText(80),
  category: optionalBusinessCategory,
  productsOrServices: optionalText(2000),
  yearsInBusiness: optionalNumber(100),
  employeeCount: optionalNumber(100000),
  businessStage: optionalBusinessStage,
  websiteUrl: optionalUrl,
  socialLinks: optionalText(1000),
  shortSummary: optionalText(300),
  journeyStory: optionalText(6000),
  challenges: optionalText(2000),
  achievements: optionalText(2000),
  communityImpact: optionalText(2000),
  futureGoals: optionalText(2000),
  supportNeeded: optionalText(500),
  fundingAmount: optionalMoney,
  useOfFunds: optionalText(2000),
  consentReview: z.coerce.boolean(),
  consentPublish: z.coerce.boolean()
});

export const submitSellerSchema = sellerProfileSchema.extend({
  city: z.string().min(2).max(80),
  region: z.string().min(2).max(80),
  category: z.enum(businessCategories),
  productsOrServices: z.string().min(2).max(2000),
  businessStage: z.enum(businessStages),
  supportNeeded: z.string().min(2).max(500),
  consentReview: z.literal(true),
  consentPublish: z.literal(true)
});

export const enquirySchema = z.object({
  sellerProfileId: z.string().min(1),
  sellerReferenceId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  organisationName: z.string().max(140).optional().nullable(),
  email: z.string().email(),
  phoneNumber: z.string().max(40).optional().nullable(),
  country: z.string().min(2).max(80),
  interestType: z.string().min(2).max(80),
  estimatedSupport: z.string().max(80).optional().nullable(),
  message: z.string().min(10).max(3000),
  preferredContactMethod: z.string().min(2).max(40),
  consent: z.literal(true)
});

export const adminStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "APPROVED", "REJECTED", "SUSPENDED", "ARCHIVED"]),
  reason: z.string().min(3).max(1000).optional(),
  sellerFacingMessage: z.string().max(1000).optional(),
  isFeatured: z.boolean().optional()
});

export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export function sanitizeFileName(name: string) {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "upload";
  return base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 100);
}
