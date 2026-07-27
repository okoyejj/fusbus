export default async function SellerLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  const errorMessage =
    error === "blocked"
      ? "For your security, that sign-in request could not be verified. Open the login page again and try once more."
      : error === "limited"
        ? "Too many sign-in attempts. Please wait a few minutes and try again."
        : error === "locked"
          ? "This account is temporarily locked after repeated failed attempts. Try again in 15 minutes."
          : error === "reset-invalid"
            ? "That password reset link is invalid or expired."
            : error === "verify-invalid"
              ? "That verification link is invalid or expired."
              : error === "method"
                ? "Use the form below to sign in."
                : "Invalid email or password. Check the details and try again.";
  const noticeMessage =
    notice === "reset-requested"
      ? "If that email is registered, password reset instructions will be sent."
      : notice === "password-reset"
        ? "Your password has been reset. You can log in now."
        : notice === "email-verified"
          ? "Your email address has been verified. You can log in now."
          : "";
  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Entrepreneur Login</h1>
      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          {errorMessage}
        </p>
      )}
      {noticeMessage && (
        <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800" role="status">
          {noticeMessage}
        </p>
      )}
      <form action="/api/auth/login" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <label className="field"><span className="label">Email address</span><input className="input" name="email" type="email" required autoComplete="email" /></label>
        <label className="field"><span className="label">Password</span><input className="input" name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn btn-primary" type="submit">Log In</button>
      </form>
    </section>
  );
}
