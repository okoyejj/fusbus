import Link from "next/link";
import { pruneFailedFormAttempts } from "@/lib/failed-form-attempts";

const fieldLabels: Record<string, string> = {
  email: "Email address",
  password: "Password",
  fullName: "Full name",
  businessName: "Business or trading name"
};

function validationDetails(details?: string) {
  return details
    ?.split("|")
    .map((detail) => {
      const [field, ...message] = detail.split(":");
      return `${fieldLabels[field] ?? field}: ${message.join(":")}`;
    })
    .filter(Boolean);
}

export default async function SellerRegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; details?: string }> }) {
  await pruneFailedFormAttempts().catch((error) => console.error("Failed to prune form attempts", error));
  const { error, details } = await searchParams;
  const invalidDetails = error === "invalid" ? validationDetails(details) : undefined;
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
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          <p>{errorMessage}</p>
          {invalidDetails && invalidDetails.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {invalidDetails.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          )}
        </div>
      )}
      <form action="/api/auth/register" method="post" className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <label className="field"><span className="label">Full name</span><input className="input" name="fullName" required autoComplete="name" /></label>
        <label className="field"><span className="label">Business or trading name</span><input className="input" name="businessName" required /></label>
        <label className="field"><span className="label">Email address</span><input className="input" name="email" type="email" required autoComplete="email" /></label>
        <label className="field">
          <span className="label">Password</span>
          <input className="input" name="password" type="password" required autoComplete="new-password" minLength={10} maxLength={72} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}" title="Use at least 10 characters with uppercase, lowercase, and a number." />
          <span className="text-sm text-stone-600">Use at least 10 characters with uppercase, lowercase, and a number.</span>
        </label>
        <button className="btn btn-primary" type="submit">Create Account</button>
      </form>
      <p className="mt-4 text-sm text-stone-700">Already registered? <Link className="font-bold text-forest" href="/seller/login">Log in</Link></p>
    </section>
  );
}
