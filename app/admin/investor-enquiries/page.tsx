import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminEnquiryForm } from "@/components/AdminEnquiryForm";
import { InvestorReceiptUploadForm } from "@/components/InvestorReceiptUploadForm";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  try {
    await requireUser(UserRole.ADMIN);
  } catch {
    redirect("/admin/login");
  }
  const enquiries = await prisma.investorEnquiry.findMany({
    include: {
      sellerProfile: true,
      investor: { include: { receipts: { orderBy: { createdAt: "desc" } } } },
      receipts: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const totalReceipts = enquiries.reduce((sum, enquiry) => sum + (enquiry.investor?.receipts.length ?? enquiry.receipts.length), 0);
  const activeInvestors = new Set(enquiries.map((enquiry) => enquiry.investorId ?? enquiry.email)).size;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-forest">Investor tracking</p>
          <h1 className="text-3xl font-black">Investor Enquiries and Receipts</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-stone-200 bg-white p-4"><p className="font-black text-2xl">{activeInvestors}</p><p className="text-stone-600">Tracked investors</p></div>
          <div className="rounded-lg border border-stone-200 bg-white p-4"><p className="font-black text-2xl">{totalReceipts}</p><p className="text-stone-600">Receipts uploaded</p></div>
        </div>
      </div>
      <div className="mt-8 grid gap-5">
        {enquiries.map((enquiry) => (
          <article key={enquiry.id} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft lg:grid-cols-[1fr_360px]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-green-50 text-forest">{enquiry.status}</span>
                <span className="badge bg-stone-100 text-ink">{enquiry.interestType}</span>
              </div>
              <h2 className="mt-3 text-xl font-black">{enquiry.fullName}</h2>
              <p className="text-sm text-stone-600">{enquiry.organisationName || "Independent"} · {enquiry.email} · {enquiry.country}</p>
              <p className="mt-3 text-sm font-bold">Entrepreneur: {enquiry.sellerProfile.businessName} ({enquiry.sellerReferenceId})</p>
              <p className="mt-3 leading-7 text-stone-700">{enquiry.message}</p>
              <div className="mt-5 grid gap-3 rounded-md bg-stone-50 p-4 text-sm sm:grid-cols-3">
                <div><p className="font-bold">Estimated support</p><p className="text-stone-700">{enquiry.estimatedSupport || "-"}</p></div>
                <div><p className="font-bold">Preferred contact</p><p className="text-stone-700">{enquiry.preferredContactMethod}</p></div>
                <div><p className="font-bold">Tracked total</p><p className="text-stone-700">{enquiry.investor?.totalCommitted ? `${enquiry.investor.totalCommitted}` : "-"}</p></div>
              </div>
              <div className="mt-5">
                <h3 className="font-black">Receipts</h3>
                <div className="mt-2 grid gap-2 text-sm">
                  {(enquiry.investor?.receipts ?? enquiry.receipts).length === 0 && <p className="text-stone-600">No receipts uploaded yet.</p>}
                  {(enquiry.investor?.receipts ?? enquiry.receipts).map((receipt) => (
                    <a key={receipt.id} className="rounded-md border border-stone-200 p-3 font-semibold text-forest hover:bg-green-50" href={receipt.fileUrl} target="_blank" rel="noreferrer">
                      {receipt.originalFileName} · {receipt.currency} {receipt.amount?.toString() ?? "-"} · {receipt.status}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid content-start gap-4">
              <AdminEnquiryForm enquiryId={enquiry.id} />
              {enquiry.investorId && <InvestorReceiptUploadForm investorId={enquiry.investorId} enquiryId={enquiry.id} />}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
