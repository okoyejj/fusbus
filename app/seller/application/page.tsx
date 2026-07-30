import { redirect } from "next/navigation";
import { MediaType, UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessStages } from "@/lib/validation";

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

export default async function SellerApplicationPage({ searchParams }: { searchParams: Promise<{ submitError?: string; fields?: string; mediaError?: string }> }) {
  let user;
  try {
    user = await requireUser(UserRole.SELLER);
  } catch {
    redirect("/seller/login");
  }
  const params = await searchParams;
  const invalidFields = params.fields?.split(",").filter(Boolean) ?? [];
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { media: true } });
  const mediaErrorMessage =
    params.mediaError === "type"
      ? "Upload JPG, PNG, or WebP images only."
      : params.mediaError === "size"
        ? "One or more images is too large."
        : params.mediaError === "count"
          ? "Product image uploads are limited to 5 total."
          : params.mediaError === "single"
            ? "Profile pictures and business logos accept one image at a time."
            : params.mediaError === "invalid"
              ? "One or more images could not be processed."
              : params.mediaError
                ? "The image upload could not be completed."
                : null;
  const fields = [
    ["fullName", "Full name"], ["businessName", "Business or trading name"], ["phoneNumber", "Phone number"], ["whatsappNumber", "WhatsApp number"], ["city", "Town or city"], ["region", "Region"], ["category", "Business category"], ["websiteUrl", "Website link"]
  ] as const;
  const longFields = [
    ["productsOrServices", "Products or services offered"], ["shortSummary", "Short summary"], ["journeyStory", "Detailed entrepreneurial journey"], ["challenges", "Challenges currently faced"], ["achievements", "Achievements so far"], ["communityImpact", "Impact on family or community"], ["futureGoals", "Future ambitions"], ["supportNeeded", "Type of support needed"], ["useOfFunds", "How investment or sponsorship would be used"], ["socialLinks", "Social media links"]
  ] as const;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Entrepreneur Application Form</h1>
      {params.submitError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <p className="font-black">Complete the required review fields before submitting.</p>
          <p className="mt-1">Your draft values were saved where possible. Please check: {invalidFields.map((field) => fieldLabels[field] ?? field).join(", ")}.</p>
        </div>
      )}
      <form action="/api/seller/profile" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map(([name, label]) => (
            <label className="field" key={name}>
              <span className="label">{label}</span>
              <input className="input" name={name} defaultValue={value(profile[name])} />
              {invalidFields.includes(name) && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
            </label>
          ))}
          <label className="field">
            <span className="label">Current business stage</span>
            <select className="input" name="businessStage" defaultValue={value(profile.businessStage)}>
              <option value="">Select a business stage</option>
              {businessStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            {invalidFields.includes("businessStage") && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
          </label>
          <label className="field"><span className="label">Years in business</span><input className="input" name="yearsInBusiness" type="number" min="0" defaultValue={value(profile.yearsInBusiness)} /></label>
          <label className="field"><span className="label">Number of employees</span><input className="input" name="employeeCount" type="number" min="0" defaultValue={value(profile.employeeCount)} /></label>
          <label className="field"><span className="label">Funding amount sought</span><input className="input" name="fundingAmount" type="number" min="0" defaultValue={value(profile.fundingAmount)} /></label>
        </div>
        {longFields.map(([name, label]) => (
          <label className="field" key={name}>
            <span className="label">{label}</span>
            <textarea className="input min-h-28" name={name} defaultValue={value(name === "socialLinks" && profile.socialLinks ? JSON.stringify(profile.socialLinks) : profile[name])} />
            {invalidFields.includes(name) && <span className="text-sm font-semibold text-red-700">Check this field before submitting for review.</span>}
          </label>
        ))}
        <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" name="consentReview" defaultChecked={profile.consentReview} required /> I consent to FusBus storing and reviewing my information.</label>
        <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" name="consentPublish" defaultChecked={profile.consentPublish} required /> I consent to approved profile information being published.</label>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-secondary" name="intent" value="draft" type="submit">Save Draft</button>
          <button className="btn btn-primary" name="intent" value="submit" type="submit">Submit for Review</button>
        </div>
      </form>
      <div className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-black">Upload Images</h2>
        {mediaErrorMessage && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{mediaErrorMessage}</p>}
        <div className="grid gap-4 md:grid-cols-3">
          <form action="/api/seller/media" method="post" encType="multipart/form-data" className="grid gap-3">
            <input type="hidden" name="mediaType" value={MediaType.PROFILE} />
            <label className="field"><span className="label">Profile picture</span><input className="input" name="files" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
            <button className="btn btn-primary" type="submit">Upload Profile Picture</button>
          </form>
          <form action="/api/seller/media" method="post" encType="multipart/form-data" className="grid gap-3">
            <input type="hidden" name="mediaType" value={MediaType.LOGO} />
            <label className="field"><span className="label">Business logo</span><input className="input" name="files" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
            <button className="btn btn-primary" type="submit">Upload Business Logo</button>
          </form>
          <form action="/api/seller/media" method="post" encType="multipart/form-data" className="grid gap-3">
            <input type="hidden" name="mediaType" value={MediaType.GALLERY} />
            <label className="field"><span className="label">Product images</span><input className="input" name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></label>
            <button className="btn btn-primary" type="submit">Upload Product Images</button>
          </form>
        </div>
        <div className="grid gap-2 text-sm text-stone-700">
          {profile.media.map((item) => <p key={item.id}>{item.mediaType}: {item.originalFileName} {item.isPublic ? "(public)" : "(private until approved)"}</p>)}
        </div>
      </div>
    </section>
  );
}
