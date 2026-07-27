import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black">How It Works</h1>
      <div className="mt-8 grid gap-5">
        {[
          ["Entrepreneur application", "Create an account, save a draft, upload images, and submit your story for review."],
          ["Administrative review", "Administrators verify completeness, request more information, approve, reject, suspend, or archive records with audit history."],
          ["Public visibility", "Approved entrepreneurs receive a reference ID and public profile. Private phone numbers and emails stay hidden."],
          ["Investor introductions", "Supporters submit enquiries to the platform team, who review and facilitate introductions."]
        ].map(([title, text]) => (
          <article key={title} className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-2 leading-7 text-stone-700">{text}</p>
          </article>
        ))}
      </div>
      <Link className="btn btn-primary mt-8" href="/seller/register">Start Entrepreneur Application</Link>
    </section>
  );
}
