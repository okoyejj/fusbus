import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  let user;
  try {
    user = await requireUser(UserRole.SELLER);
  } catch {
    redirect("/seller/login");
  }
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { media: true } });
  const required = ["city", "region", "category", "productsOrServices", "businessStage", "shortSummary", "journeyStory", "challenges", "supportNeeded", "consentReview", "consentPublish"] as const;
  const complete = Math.round((required.filter((key) => Boolean(profile[key])).length / required.length) * 100);
  const missing = required.filter((key) => !profile[key]).map((key) => key.replace(/([A-Z])/g, " $1").toLowerCase());

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Welcome, {profile.fullName}</h1>
          <p className="mt-2 text-stone-700">Application status: <StatusBadge status={profile.applicationStatus} /></p>
        </div>
        <form action="/api/auth/logout" method="post"><button className="btn btn-secondary">Log Out</button></form>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="font-black">Profile Completion</h2>
          <p className="mt-3 text-4xl font-black text-forest">{complete}%</p>
          <p className="mt-2 text-sm text-stone-700">{missing.length ? `Missing: ${missing.join(", ")}` : "Ready for review."}</p>
        </article>
        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="font-black">Images</h2>
          <p className="mt-3 text-4xl font-black text-forest">{profile.media.length}</p>
          <p className="mt-2 text-sm text-stone-700">Profile, logo, and up to ten product images.</p>
        </article>
        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="font-black">Timeline</h2>
          <p className="mt-2 text-sm text-stone-700">Created {profile.createdAt.toLocaleDateString()} {profile.submittedAt ? `· Submitted ${profile.submittedAt.toLocaleDateString()}` : ""}</p>
        </article>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="btn btn-primary" href="/seller/application">Edit Application</Link>
        {profile.applicationStatus === "APPROVED" && profile.sellerReferenceId && <Link className="btn btn-secondary" href={`/sellers/${profile.id}`}>View Public Profile</Link>}
      </div>
      {profile.sellerFacingMessage && <p className="mt-6 rounded-lg border border-gold bg-yellow-50 p-4 text-sm font-semibold">{profile.sellerFacingMessage}</p>}
    </section>
  );
}
