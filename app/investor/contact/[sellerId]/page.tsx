import { notFound } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InvestorContactPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  const seller = await prisma.sellerProfile.findFirst({ where: { id: sellerId, applicationStatus: ApplicationStatus.APPROVED } });
  if (!seller || !seller.sellerReferenceId) notFound();
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Investor Contact Form</h1>
      <p className="mt-3 text-stone-700">Your enquiry goes to the platform administrators, not directly to the entrepreneur.</p>
      <form action="/api/public/investor-enquiries" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <input type="hidden" name="sellerProfileId" value={seller.id} />
        <input type="hidden" name="sellerReferenceId" value={seller.sellerReferenceId} />
        <label className="field"><span className="label">Entrepreneur reference ID</span><input className="input" value={seller.sellerReferenceId} readOnly /></label>
        <label className="field"><span className="label">Entrepreneur business name</span><input className="input" value={seller.businessName} readOnly /></label>
        <label className="field"><span className="label">Full name</span><input className="input" name="fullName" required /></label>
        <label className="field"><span className="label">Organisation name</span><input className="input" name="organisationName" /></label>
        <label className="field"><span className="label">Email address</span><input className="input" name="email" type="email" required /></label>
        <label className="field"><span className="label">Phone number</span><input className="input" name="phoneNumber" /></label>
        <label className="field"><span className="label">Country</span><input className="input" name="country" required /></label>
        <label className="field"><span className="label">Interest type</span><select className="input" name="interestType" required><option>Investor</option><option>Sponsor</option><option>Buyer</option><option>Partner</option><option>Mentor</option><option>Other</option></select></label>
        <label className="field"><span className="label">Estimated level of support or investment</span><input className="input" name="estimatedSupport" /></label>
        <label className="field"><span className="label">Message</span><textarea className="input min-h-32" name="message" required /></label>
        <label className="field"><span className="label">Preferred contact method</span><select className="input" name="preferredContactMethod" required><option>Email</option><option>Phone</option><option>WhatsApp</option></select></label>
        <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" name="consent" required /> I consent to the platform storing and reviewing this enquiry.</label>
        <button className="btn btn-primary" type="submit">Submit Enquiry</button>
      </form>
    </section>
  );
}
