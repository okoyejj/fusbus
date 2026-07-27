import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminStatusForm } from "@/components/AdminStatusForm";

export const dynamic = "force-dynamic";

export default async function SellerReviewPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(UserRole.ADMIN);
  } catch {
    redirect("/admin/login");
  }
  const { id } = await params;
  const seller = await prisma.sellerProfile.findUnique({ where: { id }, include: { user: true, media: true } });
  if (!seller) notFound();
  const auditLogs = await prisma.auditLog.findMany({ where: { entityId: seller.id }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8">
      <div className="grid gap-6">
        <div>
          <p><StatusBadge status={seller.applicationStatus} /></p>
          <h1 className="mt-3 text-3xl font-black">Entrepreneur Review: {seller.businessName}</h1>
          <p className="text-stone-700">{seller.fullName} · {seller.user.email}</p>
        </div>
        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-black">Application Details</h2>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            {Object.entries({
              "Reference ID": seller.sellerReferenceId ?? "-",
              Phone: seller.phoneNumber ?? "-",
              WhatsApp: seller.whatsappNumber ?? "-",
              Location: `${seller.city ?? "-"}, ${seller.region ?? "-"}`,
              Category: seller.category ?? "-",
              Stage: seller.businessStage ?? "-",
              Employees: seller.employeeCount ?? "-",
              "Funding sought": seller.fundingAmount?.toString() ?? "-"
            }).map(([key, value]) => <div key={key}><dt className="font-bold">{key}</dt><dd className="text-stone-700">{value}</dd></div>)}
          </dl>
          <h3 className="mt-6 font-black">Entrepreneur Story</h3>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">{seller.journeyStory}</p>
          <h3 className="mt-6 font-black">Challenges</h3>
          <p className="mt-2 leading-7 text-stone-700">{seller.challenges}</p>
        </article>
        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-black">Uploaded Images</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seller.media.map((item) => <div key={item.id}><Image src={item.thumbnailUrl ?? item.fileUrl} alt={item.originalFileName} width={420} height={320} className="aspect-[4/3] rounded-md object-cover" /><p className="mt-1 text-xs text-stone-600">{item.mediaType} · {item.isPublic ? "public" : "private"}</p></div>)}
          </div>
        </article>
        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-black">Audit History</h2>
          <div className="mt-3 grid gap-2 text-sm text-stone-700">
            {auditLogs.map((log) => <p key={log.id}>{log.createdAt.toLocaleString()} · {log.action}</p>)}
          </div>
        </article>
      </div>
      <AdminStatusForm sellerId={seller.id} />
    </section>
  );
}
