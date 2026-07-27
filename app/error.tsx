"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-4xl font-black">Something Went Wrong</h1>
      <p className="mt-3 text-stone-700">Please try again. The platform avoids showing internal error details publicly.</p>
      <button className="btn btn-primary mt-6" onClick={reset}>Retry</button>
    </section>
  );
}
