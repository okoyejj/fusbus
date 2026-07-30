import Image from "next/image";
import Link from "next/link";
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
  const profileImage = seller.media.find((item) => item.mediaType === "PROFILE");
  const logo = seller.media.find((item) => item.mediaType === "LOGO");
  const gallery = seller.media.filter((item) => item.mediaType === "GALLERY");
  const orderedMedia = [profileImage, logo, ...gallery].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:px-8">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link className="text-sm font-bold text-forest hover:underline" href="/admin">Back to applications</Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={seller.applicationStatus} />
              {seller.isFeatured && <span className="badge bg-gold text-ink">Featured</span>}
              {seller.sellerReferenceId && <span className="badge bg-stone-100 text-ink">{seller.sellerReferenceId}</span>}
            </div>
            <h1 className="mt-3 text-3xl font-black">Entrepreneur Review: {seller.businessName}</h1>
            <p className="text-stone-700">{seller.fullName} - {seller.user.email}</p>
          </div>
          <div className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm">
            <p className="font-bold text-stone-600">Last updated</p>
            <p className="text-ink">{seller.updatedAt.toLocaleString()}</p>
          </div>
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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-stone-50 p-4">
              <h3 className="font-black">Products or Services</h3>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">{seller.productsOrServices || "-"}</p>
            </div>
            <div className="rounded-md bg-stone-50 p-4">
              <h3 className="font-black">Support Needed</h3>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">{seller.supportNeeded || "-"}</p>
            </div>
          </div>

          <h3 className="mt-6 font-black">Entrepreneur Story</h3>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">{seller.journeyStory || "-"}</p>
          <h3 className="mt-6 font-black">Challenges</h3>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">{seller.challenges || "-"}</p>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-black">Uploaded Images</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orderedMedia.map((item) => (
              <div key={item.id}>
                <Image src={item.thumbnailUrl ?? item.fileUrl} alt={item.originalFileName} width={420} height={320} className="aspect-[4/3] rounded-md object-cover" />
                <p className="mt-1 text-xs text-stone-600">{item.mediaType} - {item.isPublic ? "public" : "private"}</p>
              </div>
            ))}
            {orderedMedia.length === 0 && <p className="text-sm text-stone-600">No images uploaded yet.</p>}
          </div>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-black">Audit History</h2>
          <div className="mt-3 grid gap-2 text-sm text-stone-700">
            {auditLogs.map((log) => <p key={log.id}>{log.createdAt.toLocaleString()} - {log.action}</p>)}
            {auditLogs.length === 0 && <p>No audit entries yet.</p>}
          </div>
        </article>
      </div>

      <AdminStatusForm
        sellerId={seller.id}
        currentStatus={seller.applicationStatus}
        isFeatured={seller.isFeatured}
        rejectionReason={seller.rejectionReason}
        sellerFacingMessage={seller.sellerFacingMessage}
      />
    </section>
  );
}
