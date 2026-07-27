import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  try {
    await requireUser(UserRole.ADMIN);
  } catch {
    redirect("/admin/login");
  }
  const filters = await searchParams;
  const q = filters.q?.trim();
  const sellers = await prisma.sellerProfile.findMany({
    where: {
      deletedAt: null,
      ...(filters.status ? { applicationStatus: filters.status as never } : {}),
      ...(q ? { OR: [{ businessName: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }, { sellerReferenceId: { contains: q, mode: "insensitive" } }] } : {})
    },
    include: { user: { select: { email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 50
  });
  const enquiries = await prisma.investorEnquiry.count({ where: { status: "NEW" } });
  const receipts = await prisma.investorTransactionReceipt.count();
  const statusCounts = await prisma.sellerProfile.groupBy({
    by: ["applicationStatus"],
    where: { deletedAt: null },
    _count: { applicationStatus: true }
  });
  const countFor = (status: ApplicationStatus) => statusCounts.find((item) => item.applicationStatus === status)?._count.applicationStatus ?? 0;
  const totalApplications = statusCounts.reduce((sum, item) => sum + item._count.applicationStatus, 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-forest">Operations control centre</p>
          <h1 className="text-3xl font-black">Entrepreneur Applications</h1>
        </div>
        <Link className="btn btn-secondary" href="/admin/investor-enquiries">Investor Tracking ({enquiries} new)</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", totalApplications],
          ["Submitted", countFor(ApplicationStatus.SUBMITTED)],
          ["Under Review", countFor(ApplicationStatus.UNDER_REVIEW)],
          ["Needs Info", countFor(ApplicationStatus.MORE_INFORMATION_REQUIRED)],
          ["Approved", countFor(ApplicationStatus.APPROVED)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-black text-ink">{value}</p>
            <p className="mt-1 text-sm font-semibold text-stone-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <form className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-4">
        <input className="input md:col-span-2" name="q" placeholder="Search entrepreneurs, business, or reference" defaultValue={filters.q} />
        <select className="input" name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under Review</option><option value="MORE_INFORMATION_REQUIRED">More Information Required</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select>
        <button className="btn btn-primary" type="submit">Filter</button>
      </form>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm font-bold text-stone-600">Investor receipts</p>
          <p className="mt-1 text-3xl font-black">{receipts}</p>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase"><tr><th className="p-3">Business</th><th className="p-3">Entrepreneur</th><th className="p-3">Category</th><th className="p-3">Location</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3">Action</th></tr></thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id} className="border-t border-stone-200 hover:bg-stone-50">
                <td className="p-3 font-bold">{seller.businessName}<br /><span className="font-normal text-stone-500">{seller.sellerReferenceId ?? "No reference yet"}</span></td>
                <td className="p-3">{seller.fullName}<br /><span className="text-stone-500">{seller.user.email}</span></td>
                <td className="p-3">{seller.category ?? "-"}</td>
                <td className="p-3">{seller.city ?? "-"}, {seller.region ?? "-"}</td>
                <td className="p-3"><StatusBadge status={seller.applicationStatus} /></td>
                <td className="p-3">{seller.updatedAt.toLocaleDateString()}</td>
                <td className="p-3"><Link className="btn btn-secondary" href={`/admin/sellers/${seller.id}`}>Review</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
