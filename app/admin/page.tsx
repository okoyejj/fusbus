import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const statusFilters = [
  [ApplicationStatus.SUBMITTED, "Submitted"],
  [ApplicationStatus.UNDER_REVIEW, "Under Review"],
  [ApplicationStatus.MORE_INFORMATION_REQUIRED, "Needs Info"],
  [ApplicationStatus.APPROVED, "Approved"],
  [ApplicationStatus.REJECTED, "Rejected"],
  [ApplicationStatus.SUSPENDED, "Suspended"],
  [ApplicationStatus.ARCHIVED, "Archived"]
] as const;

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  try {
    await requireUser(UserRole.ADMIN);
  } catch {
    redirect("/admin/login");
  }

  const filters = await searchParams;
  const q = filters.q?.trim();
  const selectedStatus = Object.values(ApplicationStatus).includes(filters.status as ApplicationStatus) ? filters.status as ApplicationStatus : undefined;
  const sellers = await prisma.sellerProfile.findMany({
    where: {
      deletedAt: null,
      ...(selectedStatus ? { applicationStatus: selectedStatus } : {}),
      ...(q ? { OR: [{ businessName: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }, { sellerReferenceId: { contains: q, mode: "insensitive" } }] } : {})
    },
    include: { user: { select: { email: true } } },
    orderBy: [{ applicationStatus: "asc" }, { updatedAt: "desc" }],
    take: 50
  });
  const enquiries = await prisma.investorEnquiry.count({ where: { status: "NEW" } });
  const receipts = await prisma.investorTransactionReceipt.count();
  const featured = await prisma.sellerProfile.count({ where: { deletedAt: null, applicationStatus: ApplicationStatus.APPROVED, isFeatured: true } });
  const statusCounts = await prisma.sellerProfile.groupBy({
    by: ["applicationStatus"],
    where: { deletedAt: null },
    _count: { applicationStatus: true }
  });
  const countFor = (status: ApplicationStatus) => statusCounts.find((item) => item.applicationStatus === status)?._count.applicationStatus ?? 0;
  const totalApplications = statusCounts.reduce((sum, item) => sum + item._count.applicationStatus, 0);
  const querySuffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-forest">Operations control centre</p>
          <h1 className="text-3xl font-black">Entrepreneur Applications</h1>
          <p className="mt-2 text-sm text-stone-600">Review submissions, approve public profiles, and choose featured businesses.</p>
        </div>
        <Link className="btn btn-secondary" href="/admin/investor-enquiries">Investor Tracking ({enquiries} new)</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", totalApplications],
          ["Submitted", countFor(ApplicationStatus.SUBMITTED)],
          ["Needs Review", countFor(ApplicationStatus.UNDER_REVIEW) + countFor(ApplicationStatus.MORE_INFORMATION_REQUIRED)],
          ["Approved", countFor(ApplicationStatus.APPROVED)],
          ["Featured", featured]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-black text-ink">{value}</p>
            <p className="mt-1 text-sm font-semibold text-stone-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link className={`badge ${selectedStatus ? "bg-stone-100 text-ink" : "bg-forest text-white"}`} href={q ? `/admin?q=${encodeURIComponent(q)}` : "/admin"}>All ({totalApplications})</Link>
        {statusFilters.map(([status, label]) => (
          <Link key={status} className={`badge ${selectedStatus === status ? "bg-forest text-white" : "bg-stone-100 text-ink"}`} href={`/admin?status=${status}${querySuffix}`}>
            {label} ({countFor(status)})
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <form className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-4">
          <input className="input md:col-span-2" name="q" placeholder="Search entrepreneurs, business, or reference" defaultValue={filters.q} />
          <select className="input" name="status" defaultValue={selectedStatus ?? ""}>
            <option value="">All statuses</option>
            {statusFilters.map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
          <button className="btn btn-primary" type="submit">Filter</button>
        </form>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm font-bold text-stone-600">Investor receipts</p>
          <p className="mt-1 text-3xl font-black">{receipts}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Entrepreneur</th>
              <th className="p-3">Category</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id} className="border-t border-stone-200 hover:bg-stone-50">
                <td className="p-3 font-bold">{seller.businessName}<br /><span className="font-normal text-stone-500">{seller.sellerReferenceId ?? "No reference yet"}</span></td>
                <td className="p-3">{seller.fullName}<br /><span className="text-stone-500">{seller.user.email}</span></td>
                <td className="p-3">{seller.category ?? "-"}</td>
                <td className="p-3">{seller.city ?? "-"}, {seller.region ?? "-"}</td>
                <td className="p-3"><StatusBadge status={seller.applicationStatus} /></td>
                <td className="p-3">{seller.isFeatured ? <span className="badge bg-gold text-ink">Featured</span> : <span className="text-stone-500">-</span>}</td>
                <td className="p-3">{seller.updatedAt.toLocaleDateString()}</td>
                <td className="p-3"><Link className="btn btn-secondary" href={`/admin/sellers/${seller.id}`}>Review</Link></td>
              </tr>
            ))}
            {sellers.length === 0 && (
              <tr>
                <td className="p-8 text-center text-stone-600" colSpan={8}>No applications match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
