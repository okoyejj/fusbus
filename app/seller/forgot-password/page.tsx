import Link from "next/link";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage = error === "limited"
    ? "Too many requests. Please wait before trying again."
    : "For your security, that request could not be verified. Open this page again and try once more.";

  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Forgot your password?</h1>
      <p className="mt-3 text-stone-700">Enter your account email and we will send you a secure link to choose a new password.</p>
      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          {errorMessage}
        </p>
      )}
      <form action="/api/auth/forgot-password" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <label className="field">
          <span className="label">Email address</span>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </label>
        <button className="btn btn-primary" type="submit">Send reset link</button>
      </form>
      <p className="mt-4 text-sm text-stone-700"><Link className="font-bold text-forest" href="/seller/login">Back to login</Link></p>
    </section>
  );
}
