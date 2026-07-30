import Link from "next/link";

export default async function SellerRegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage =
    error === "blocked"
      ? "For your security, that registration request could not be verified. Open this page again and try once more."
      : error === "limited"
        ? "Too many registration attempts. Please wait a few minutes and try again."
        : error === "exists"
          ? "An account already exists for that email address. Log in instead."
          : error === "method"
            ? "Use the form below to create your account."
            : "Please check the registration form and try again.";
  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Entrepreneur Registration</h1>
      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          {errorMessage}
        </p>
      )}
      <form action="/api/auth/register" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <label className="field"><span className="label">Full name</span><input className="input" name="fullName" required autoComplete="name" /></label>
        <label className="field"><span className="label">Business or trading name</span><input className="input" name="businessName" required /></label>
        <label className="field"><span className="label">Email address</span><input className="input" name="email" type="email" required autoComplete="email" /></label>
        <label className="field">
          <span className="label">Password</span>
          <input className="input" name="password" type="password" required autoComplete="new-password" minLength={10} />
          <span className="text-sm text-stone-600">Use at least 10 characters with uppercase, lowercase, and a number.</span>
        </label>
        <button className="btn btn-primary" type="submit">Create Account</button>
      </form>
      <p className="mt-4 text-sm text-stone-700">Already registered? <Link className="font-bold text-forest" href="/seller/login">Log in</Link></p>
    </section>
  );
}
