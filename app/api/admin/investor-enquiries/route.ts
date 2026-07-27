import { NextRequest, NextResponse } from "next/server";
import { EnquiryStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/security";

export async function GET(request: NextRequest) {
  await requireUser(UserRole.ADMIN);
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const where: Prisma.InvestorEnquiryWhereInput = {
    ...(params.get("status") ? { status: params.get("status") as EnquiryStatus } : {}),
    ...(params.get("interestType") ? { interestType: params.get("interestType")! } : {}),
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { sellerReferenceId: { contains: q, mode: "insensitive" } }, { sellerProfile: { businessName: { contains: q, mode: "insensitive" } } }] } : {})
  };
  const enquiries = await prisma.investorEnquiry.findMany({ where, include: { sellerProfile: true, investor: true, receipts: true, assignedAdmin: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ enquiries });
}

export async function PATCH(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const admin = await requireUser(UserRole.ADMIN);
  const body = await request.json() as { id?: string; status?: EnquiryStatus; assignedAdminId?: string; note?: string };
  if (!body.id) return NextResponse.json({ error: "Missing enquiry id" }, { status: 400 });
  const oldValues = await prisma.investorEnquiry.findUniqueOrThrow({ where: { id: body.id } });
  const enquiry = await prisma.investorEnquiry.update({
    where: { id: body.id },
    data: {
      status: body.status,
      assignedAdminId: body.assignedAdminId
    }
  });
  if (body.note) {
    await prisma.adminNote.create({ data: { adminUserId: admin.id, relatedEntityType: "InvestorEnquiry", relatedEntityId: enquiry.id, note: body.note } });
  }
  await audit(request, { actorUserId: admin.id, action: "ADMIN_ENQUIRY_UPDATED", entityType: "InvestorEnquiry", entityId: enquiry.id, oldValues, newValues: enquiry });
  return NextResponse.json({ enquiry });
}
