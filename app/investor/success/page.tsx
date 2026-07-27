import Link from "next/link";

export default async function InvestorSuccessPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black">Enquiry Received</h1>
      <p className="mt-4 leading-7 text-stone-700">Thank you. The platform administrators will review your enquiry{ref ? ` for entrepreneur ${ref}` : ""} and facilitate the next step where appropriate.</p>
      <Link className="btn btn-primary mt-8" href="/sellers">Continue Browsing</Link>
    </section>
  );
}
