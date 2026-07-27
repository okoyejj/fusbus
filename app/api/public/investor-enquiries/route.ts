import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enquirySchema } from "@/lib/validation";
import { queueNotification } from "@/lib/notifications";
import { rateLimit, requireSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const limited = rateLimit(request, "investor-enquiry", 10, 60 * 60 * 1000);
  if (limited) return limited;
  const body = Object.fromEntries((await request.formData()).entries());
  const parsed = enquirySchema.safeParse({ ...body, consent: body.consent === "on" || body.consent === "true" });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const seller = await prisma.sellerProfile.findFirst({
    where: { id: parsed.data.sellerProfileId, sellerReferenceId: parsed.data.sellerReferenceId, applicationStatus: ApplicationStatus.APPROVED }
  });
  if (!seller) return NextResponse.json({ error: "Entrepreneur not available" }, { status: 404 });
  const investor = await prisma.investor.upsert({
    where: {
      email_organisationName: {
        email: parsed.data.email.toLowerCase(),
        organisationName: parsed.data.organisationName ?? ""
      }
    },
    update: {
      fullName: parsed.data.fullName,
      phoneNumber: parsed.data.phoneNumber,
      country: parsed.data.country,
      interestType: parsed.data.interestType
    },
    create: {
      fullName: parsed.data.fullName,
      organisationName: parsed.data.organisationName ?? "",
      email: parsed.data.email.toLowerCase(),
      phoneNumber: parsed.data.phoneNumber,
      country: parsed.data.country,
      interestType: parsed.data.interestType
    }
  });
  const enquiry = await prisma.investorEnquiry.create({ data: { ...parsed.data, email: parsed.data.email.toLowerCase(), investorId: investor.id } });
  await queueNotification({ type: "INVESTOR_ENQUIRY_CONFIRMATION", subject: "Enquiry received", message: `Thank you ${parsed.data.fullName}. We received your enquiry about ${seller.businessName}.` });
  await queueNotification({ type: "NEW_INVESTOR_ENQUIRY", subject: "New investor enquiry", message: `${parsed.data.fullName} asked about ${seller.businessName}.` });
  return NextResponse.redirect(new URL(`/investor/success?ref=${encodeURIComponent(enquiry.sellerReferenceId)}`, request.url), 303);
}
