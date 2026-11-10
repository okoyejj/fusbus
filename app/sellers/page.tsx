import Link from "next/link";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { paginationHref, paginationState, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { publicSellerSelect } from "@/lib/public-select";
import { SellerCard } from "@/components/SellerCard";
import { businessCategories } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function SellersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; category?: string; location?: string; stage?: string; support?: string }> }) {
  const filters = await searchParams;
  const q = filters.q?.trim();
  const where: Prisma.SellerProfileWhereInput = {
    applicationStatus: ApplicationStatus.APPROVED,
    deletedAt: null,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.location ? { city: filters.location } : {}),
    ...(filters.stage ? { businessStage: filters.stage } : {}),
    ...(filters.support ? { supportNeeded: { contains: filters.support, mode: "insensitive" } } : {}),
    ...(q ? { OR: [{ businessName: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }, { sellerReferenceId: { contains: q, mode: "insensitive" } }, { productsOrServices: { contains: q, mode: "insensitive" } }] } : {})
  };
  const total = await prisma.sellerProfile.count({ where });
  const pagination = paginationState({ page: parsePage(filters.page), totalItems: total, pageSize: 9 });
  const paginationParams = { q, category: filters.category, location: filters.location, stage: filters.stage, support: filters.support };
  const sellers = await prisma.sellerProfile.findMany({
    where,
    select: publicSellerSelect,
    orderBy: [{ isFeatured: "desc" }, { approvedAt: "desc" }, { id: "asc" }],
    take: pagination.pageSize,
    skip: pagination.skip
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black">Meet Our Entrepreneurs</h1>
      <form className="mt-8 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-5">
        <input className="input md:col-span-2" name="q" placeholder="Search name, reference, product" defaultValue={filters.q} />
        <select className="input" name="category" defaultValue={filters.category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {businessCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <input className="input" name="location" placeholder="Location" defaultValue={filters.location} />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sellers.map((seller) => <SellerCard key={seller.id} seller={seller} />)}
      </div>
      {total > 0 && (
        <nav aria-label="Entrepreneur pagination" className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-4 text-sm">
          <p>Showing {pagination.skip + 1}–{pagination.skip + sellers.length} of {total} entrepreneurs</p>
          <div className="flex items-center gap-3">
            {pagination.hasPreviousPage ? (
              <Link className="btn btn-secondary" href={paginationHref("/sellers", paginationParams, pagination.page - 1)}>Previous</Link>
            ) : <span className="btn btn-secondary opacity-50" aria-disabled="true">Previous</span>}
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            {pagination.hasNextPage ? (
              <Link className="btn btn-secondary" href={paginationHref("/sellers", paginationParams, pagination.page + 1)}>Next</Link>
            ) : <span className="btn btn-secondary opacity-50" aria-disabled="true">Next</span>}
          </div>
        </nav>
      )}
      {sellers.length === 0 && <p className="mt-8 rounded-lg border border-stone-200 bg-white p-5 text-stone-700">No approved entrepreneurs match those filters yet.</p>}
    </section>
  );
}
