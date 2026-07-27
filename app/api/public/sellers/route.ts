import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicSellerSelect } from "@/lib/public-select";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const where: Prisma.SellerProfileWhereInput = {
    applicationStatus: ApplicationStatus.APPROVED,
    deletedAt: null,
    ...(params.get("category") ? { category: params.get("category")! } : {}),
    ...(params.get("location") ? { city: params.get("location")! } : {}),
    ...(params.get("stage") ? { businessStage: params.get("stage")! } : {}),
    ...(params.get("support") ? { supportNeeded: { contains: params.get("support")!, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { sellerReferenceId: { contains: q, mode: "insensitive" } },
            { productsOrServices: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const sellers = await prisma.sellerProfile.findMany({
    where,
    select: publicSellerSelect,
    orderBy: [{ isFeatured: "desc" }, { approvedAt: "desc" }],
    take: Math.min(Number(params.get("take") ?? 24), 50),
    skip: Number(params.get("skip") ?? 0)
  });
  return NextResponse.json({ sellers });
}
