import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sellerProfileSchema, submitSellerSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { requireSameOrigin } from "@/lib/security";
import { sellerProfileUpsertArgs } from "@/lib/seller-application";

function validationRedirect(request: NextRequest, fields: string[]) {
  const url = new URL("/seller/application", request.url);
  url.searchParams.set("submitError", "1");
  url.searchParams.set("fields", fields.join(","));
  return NextResponse.redirect(url, 303);
}

export async function GET() {
  const user = await requireUser(UserRole.SELLER);
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, include: { media: true } });
  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const user = await requireUser(UserRole.SELLER);
  const body = Object.fromEntries((await request.formData()).entries());
  const submit = body.intent === "submit";
  const parsed = (submit ? submitSellerSchema : sellerProfileSchema).safeParse({
    ...body,
    consentReview: body.consentReview === "on" || body.consentReview === "true",
    consentPublish: body.consentPublish === "on" || body.consentPublish === "true"
  });
  if (!parsed.success) {
    const draftParsed = sellerProfileSchema.safeParse({
      ...body,
      consentReview: body.consentReview === "on" || body.consentReview === "true",
      consentPublish: body.consentPublish === "on" || body.consentPublish === "true"
    });
    if (draftParsed.success) {
      const oldDraft = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
      await prisma.sellerProfile.upsert(sellerProfileUpsertArgs(user.id, draftParsed.data, false, oldDraft?.applicationStatus, oldDraft?.submittedAt));
    }
    return validationRedirect(request, Object.keys(parsed.error.flatten().fieldErrors));
  }
  const oldProfile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  const profile = await prisma.sellerProfile.upsert(sellerProfileUpsertArgs(user.id, parsed.data, submit, oldProfile?.applicationStatus, oldProfile?.submittedAt));
  await audit(request, { actorUserId: user.id, action: submit ? "SELLER_SUBMITTED" : "SELLER_DRAFT_SAVED", entityType: "SellerProfile", entityId: profile.id, oldValues: oldProfile, newValues: profile });
  if (submit) {
    await queueNotification({ userId: user.id, type: "APPLICATION_SUBMITTED", subject: "Application submitted", message: "Your entrepreneur application has been submitted for review." });
  }
  return NextResponse.redirect(new URL("/seller/dashboard", request.url), 303);
}
