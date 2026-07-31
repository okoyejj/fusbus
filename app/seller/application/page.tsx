import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessCategories, businessStages } from "@/lib/validation";
import { FeedbackModal } from "@/components/FeedbackModal";
import { SellerMediaManager } from "@/components/SellerMediaManager";
import { SellerApplicationForm } from "@/components/SellerApplicationForm";
import { CountedTextarea } from "@/components/CountedTextarea";

export const dynamic = "force-dynamic";

function value(input: unknown) {
  return input == null ? "" : String(input);
}

const fieldLabels: Record<string, string> = {
  productsOrServices: "Products or services offered",
  businessStage: "Current business stage",
  websiteUrl: "Website link",
  journeyStory: "Detailed entrepreneurial journey",
  supportNeeded: "Type of support needed",
  city: "Town or city",
  region: "Region",
  category: "Business category",
  shortSummary: "Short summary",
  challenges: "Challenges currently faced",
  consentReview: "Consent to store and review information",
  consentPublish: "Consent to publish approved profile information"
};

const requiredForSubmit = new Set(["city", "region", "category", "productsOrServices", "businessStage", "supportNeeded"]);

function labelText(name: string, label: string) {
  return requiredForSubmit.has(name) ? `${label} *` : label;
}

export default async function SellerApplicationPage({ searchParams }: { searchParams: Promise<{ submitError?: string; fields?: string; mediaError?: string; submitted?: string; mediaUploaded?: string }> }) {
  let user;
  try {
    user = await requireUser(UserRole.SELLER);
  } catch {
    redirect("/seller/login");
  }
  const params = await searchParams;
  const invalidFields = params.fields?.split(",").filter(Boolean) ?? [];
  const profile = await prisma.sellerProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: { media: { orderBy: [{ mediaType: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } }
  });
  const fields = [
    ["fullName", "Full name", 120], ["businessName", "Business or trading name", 140], ["phoneNumber", "Phone number", 40], ["whatsappNumber", "WhatsApp number", 40], ["city", "Town or city", 80], ["region", "Region", 80], ["websiteUrl", "Website link", 500]
  ] as const;
  const longFields = [
    ["productsOrServices", "Products or services offered", 2000], ["shortSummary", "Short summary", 300], ["journeyStory", "Detailed entrepreneurial journey", 6000], ["challenges", "Challenges currently faced", 2000], ["achievements", "Achievements so far", 2000], ["communityImpact", "Impact on family or community", 2000], ["futureGoals", "Future ambitions", 2000], ["supportNeeded", "Type of support needed", 500], ["useOfFunds", "How investment or sponsorship would be used", 2000], ["socialLinks", "Social media links", 1000]
  ] as const;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <FeedbackModal
        open={params.submitted === "1"}
        title="Application submitted"
        message="Your entrepreneur application has been submitted for review. The FusBus team will check your profile and contact you if anything else is needed."
        primaryHref="/seller/dashboard"
        primaryLabel="Go to Dashboard"
        closeHref="/seller/application"
        secondaryLabel="Continue Editing"
      />
      <h1 className="text-3xl font-black">Entrepreneur Application Form</h1>
      <p className="mt-2 text-sm text-stone-700">Fields marked * are required before submitting for review. You can save a draft at any time.</p>
      {params.submitError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <p className="font-black">{params.submitError === "server" ? "Your application could not be saved." : "Your draft was saved, but it is not ready to submit yet."}</p>
          <p className="mt-1">
            {params.submitError === "server"
              ? "Please try again. If this keeps happening, contact the FusBus team with the email address used for this account."
              : `Your draft values were saved where possible. Please check: ${invalidFields.map((field) => fieldLabels[field] ?? field).join(", ")}.`}
          </p>
        </div>
      )}
      <SellerApplicationForm>
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map(([name, label, maxLength]) => (
            <label className="field" key={name}>
              <span className="label">{labelText(name, label)}</span>
              <input className="input" name={name} defaultValue={value(profile[name])} required={requiredForSubmit.has(name)} maxLength={maxLength} />
              {invalidFields.includes(name) && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
            </label>
          ))}
          <label className="field">
            <span className="label">Business category *</span>
            <select className="input" name="category" defaultValue={value(profile.category)} required>
              <option value="">Select a business category</option>
              {businessCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            {invalidFields.includes("category") && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
          </label>
          <label className="field">
            <span className="label">Current business stage *</span>
            <select className="input" name="businessStage" defaultValue={value(profile.businessStage)} required>
              <option value="">Select a business stage</option>
              {businessStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            {invalidFields.includes("businessStage") && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
          </label>
          <label className="field"><span className="label">Years in business</span><input className="input" name="yearsInBusiness" type="number" min="0" defaultValue={value(profile.yearsInBusiness)} /></label>
          <label className="field"><span className="label">Number of employees</span><input className="input" name="employeeCount" type="number" min="0" defaultValue={value(profile.employeeCount)} /></label>
          <label className="field"><span className="label">Funding amount sought</span><input className="input" name="fundingAmount" type="number" min="0" defaultValue={value(profile.fundingAmount)} /></label>
        </div>
        {longFields.map(([name, label, maxLength]) => (
          <label className="field" key={name}>
            <span className="label">{labelText(name, label)}</span>
            <CountedTextarea name={name} defaultValue={value(name === "socialLinks" && profile.socialLinks ? JSON.stringify(profile.socialLinks) : profile[name])} maxLength={maxLength} required={requiredForSubmit.has(name)} />
            {invalidFields.includes(name) && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
          </label>
        ))}
        <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" name="consentReview" defaultChecked={profile.consentReview} required /> I consent to FusBus storing and reviewing my information.</label>
        <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" name="consentPublish" defaultChecked={profile.consentPublish} required /> I consent to approved profile information being published.</label>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-secondary" name="intent" value="draft" type="submit" formNoValidate>Save Draft</button>
          <button className="btn btn-primary" name="intent" value="submit" type="submit">Submit for Review</button>
        </div>
      </SellerApplicationForm>
      <SellerMediaManager initialMedia={profile.media.map((item) => ({
        id: item.id,
        mediaType: item.mediaType,
        originalFileName: item.originalFileName,
        fileUrl: item.fileUrl,
        thumbnailUrl: item.thumbnailUrl,
        fileSize: item.fileSize,
        isPublic: item.isPublic
      }))} />
    </section>
  );
}
