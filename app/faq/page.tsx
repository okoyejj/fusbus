export default function FaqPage() {
  const faqs = [
    ["Is this the marketplace?", "No. This phase is for onboarding, review, approval, and investor introductions."],
    ["Can investors contact entrepreneurs directly?", "No. Enquiries are submitted to administrators who facilitate introductions."],
    ["When is my profile public?", "Only after administrative approval and publication consent."]
  ];
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black">Frequently Asked Questions</h1>
      <div className="mt-8 grid gap-4">
        {faqs.map(([q, a]) => (
          <article key={q} className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="font-black">{q}</h2>
            <p className="mt-2 text-stone-700">{a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
