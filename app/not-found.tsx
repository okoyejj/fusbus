import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-4xl font-black">Page Not Found</h1>
      <p className="mt-3 text-stone-700">The page you requested could not be found.</p>
      <Link href="/" className="btn btn-primary mt-6">Return Home</Link>
    </section>
  );
}
