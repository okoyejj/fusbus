import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import { SellerCard } from "@/components/SellerCard";
import { publicSellerSelect } from "@/lib/public-select";
import { HeroCarousel } from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.sellerProfile.findMany({
    where: { applicationStatus: ApplicationStatus.APPROVED, deletedAt: null, isFeatured: true },
    select: publicSellerSelect,
    take: 3
  });

  return (
    <>
      <HeroCarousel />

      <section className="border-y border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ["Apply", "Tell us about yourself, your business, and your entrepreneurial journey."],
            ["Review", "Our team reviews your profile to ensure it is complete, genuine, and ready for international visibility."],
            ["Approval", "Approved entrepreneurs receive a public profile and a unique entrepreneur reference ID."],
            ["Global Connection", "International investors, sponsors, buyers, and partners can express interest through our platform."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-stone-200 bg-white p-5">
              <h2 className="text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-700">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-black">Our Mission</h2>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            Our mission is to give hardworking Cameroonian entrepreneurs the visibility, connections, and opportunities they need to build sustainable businesses and compete globally.
          </p>
        </div>
        <div>
          <h2 className="text-3xl font-black">Discover Entrepreneurs Worth Supporting</h2>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            Browse approved entrepreneur profiles, learn about their journeys, and contact our team to explore sponsorship, investment, partnership, mentorship, or purchasing opportunities.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-normal text-ember">A broader Cameroon marketplace pipeline</p>
            <h2 className="mt-2 text-3xl font-black">Built for every credible entrepreneur, maker, and service provider</h2>
            <p className="mt-4 leading-7 text-stone-700">
              The platform supports entrepreneurs across regions, languages, ethnic communities, and business types, from fashion and food processing to manufacturing, agriculture, retail, professional services, logistics, digital trade, and creative industries.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Artisans and fashion designers", "Food processors and farmers", "Manufacturers and repair services", "Digital entrepreneurs and consultants"].map((label) => (
              <div key={label} className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-sm font-black text-ink">{label}</div>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-black sm:text-3xl">Featured Entrepreneurs</h2>
              <Link className="font-bold text-forest" href="/sellers">View all</Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {featured.map((seller) => <SellerCard key={seller.id} seller={seller} />)}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm leading-6 text-stone-700 sm:px-6 lg:px-8">
          <p>
            Every published entrepreneur is reviewed. Private contact details are protected. Investor enquiries are managed by the platform and introductions are facilitated carefully. Approval is not a financial guarantee or investment recommendation.
          </p>
        </div>
      </section>
    </>
  );
}
