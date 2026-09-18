import Link from "next/link";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  const errorMessage = error === "mismatch"
    ? "The passwords do not match. Please enter them again."
    : error === "password-invalid"
      ? "Use at least 10 characters with uppercase, lowercase, and a number."
      : error === "limited"
        ? "Too many attempts. Please wait before trying again."
        : "That password reset link is invalid or expired. Please request a new one.";

  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Choose a new password</h1>
      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          {errorMessage}
        </p>
      )}
      {token ? (
        <form action="/api/auth/reset-password" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <input name="token" type="hidden" value={token} />
          <label className="field">
            <span className="label">New password</span>
            <input className="input" name="password" type="password" required autoComplete="new-password" minLength={10} />
            <span className="text-sm text-stone-600">Use at least 10 characters with uppercase, lowercase, and a number.</span>
          </label>
          <label className="field">
            <span className="label">Confirm new password</span>
            <input className="input" name="confirmPassword" type="password" required autoComplete="new-password" minLength={10} />
          </label>
          <button className="btn btn-primary" type="submit">Change password</button>
        </form>
      ) : (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-stone-800">This reset link is missing or no longer valid.</p>
      )}
      <p className="mt-4 text-sm text-stone-700"><Link className="font-bold text-forest" href="/seller/forgot-password">Request a new reset link</Link></p>
    </section>
  );
}
