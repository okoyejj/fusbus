import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await requireUser(UserRole.ADMIN);
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const where: Prisma.SellerProfileWhereInput = {
    deletedAt: null,
    ...(params.get("status") ? { applicationStatus: params.get("status") as never } : {}),
    ...(params.get("category") ? { category: params.get("category")! } : {}),
    ...(params.get("location") ? { city: params.get("location")! } : {}),
    ...(q ? { OR: [{ businessName: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }, { sellerReferenceId: { contains: q, mode: "insensitive" } }] } : {})
  };
  const sellers = await prisma.sellerProfile.findMany({ where, include: { user: { select: { email: true } }, media: true }, orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ sellers });
}
