import { SellerProfileDetails } from "@/components/SellerProfileDetails";
import { prisma } from "@/lib/prisma";
import { publicSellerSelect } from "@/lib/public-select";
import { ApplicationStatus } from "@prisma/client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await prisma.sellerProfile.findFirst({
    where: { id, applicationStatus: ApplicationStatus.APPROVED, deletedAt: null },
    select: publicSellerSelect
  });
  if (!seller) notFound();

  return (
    <section className="bg-white">
      <SellerProfileDetails seller={seller} />
    </section>
  );
}
