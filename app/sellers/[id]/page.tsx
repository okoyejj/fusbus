import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicSellerSelect } from "@/lib/public-select";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await prisma.sellerProfile.findFirst({
    where: { id, applicationStatus: ApplicationStatus.APPROVED, deletedAt: null },
    select: publicSellerSelect
  });
  if (!seller) notFound();
  const profileImage = seller.media.find((item) => item.mediaType === "PROFILE") ?? seller.media[0];
  const logo = seller.media.find((item) => item.mediaType === "LOGO");
  const gallery = seller.media.filter((item) => item.mediaType === "GALLERY");

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <div className="grid gap-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
            {profileImage && <Image src={profileImage.fileUrl} alt={`${seller.businessName} entrepreneur profile`} fill className="object-cover" />}
          </div>
          {logo && <Image src={logo.thumbnailUrl ?? logo.fileUrl} alt={`${seller.businessName} logo`} width={80} height={80} className="h-20 w-20 rounded-md border border-stone-200 object-contain" />}
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-forest">{seller.sellerReferenceId}</p>
          <h1 className="mt-2 text-4xl font-black">{seller.businessName}</h1>
          <p className="mt-2 text-stone-700">{seller.category} · {seller.city}, {seller.region}</p>
          <p className="mt-6 text-lg leading-8 text-stone-700">{seller.shortSummary}</p>
          <Link className="btn btn-primary mt-6" href={`/investor/contact/${seller.id}`}>Interested in supporting or investing in this entrepreneur?</Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <article className="lg:col-span-2">
          <h2 className="text-2xl font-black">Entrepreneur Journey</h2>
          <p className="mt-4 whitespace-pre-wrap leading-8 text-stone-700">{seller.journeyStory}</p>
        </article>
        <aside className="grid content-start gap-4 rounded-lg border border-stone-200 bg-stone-50 p-5">
          <h2 className="text-xl font-black">Support Required</h2>
          <p className="leading-7 text-stone-700">{seller.supportNeeded}</p>
          <h3 className="font-black">Products or Services</h3>
          <p className="leading-7 text-stone-700">{seller.productsOrServices}</p>
        </aside>
        {[
          ["Achievements", seller.achievements],
          ["Business Impact", seller.communityImpact],
          ["Future Goals", seller.futureGoals],
          ["Investment or Sponsorship Use", seller.useOfFunds]
        ].map(([title, text]) => text && (
          <article key={title} className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="font-black">{title}</h2>
            <p className="mt-2 leading-7 text-stone-700">{text}</p>
          </article>
        ))}
      </div>
      {gallery.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black">Business Gallery</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => <Image key={item.id} src={item.fileUrl} alt={item.originalFileName} width={640} height={480} className="aspect-[4/3] rounded-lg object-cover" />)}
          </div>
        </div>
      )}
    </section>
  );
}
