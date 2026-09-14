"use client";

import { mediaUrl } from "@/lib/media-url";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type SellerMediaItem = {
  id: string;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  originalFileName: string;
};

type SellerProfileDetailsProps = {
  seller: {
    id: string;
    sellerReferenceId: string | null;
    businessName: string;
    fullName: string;
    category: string | null;
    city: string | null;
    region: string | null;
    shortSummary: string | null;
    journeyStory: string | null;
    productsOrServices: string | null;
    supportNeeded: string | null;
    achievements: string | null;
    communityImpact: string | null;
    futureGoals: string | null;
    useOfFunds: string | null;
    media: SellerMediaItem[];
  };
};

type TextModal = { title: string; text: string };
type ImageModal = { src: string; alt: string };
type SectionVariant = "large" | "card" | "compact";

function previewText(text: string, maxLength = 360) {
  const normalized = text.trim();
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 220 ? lastSpace : maxLength).trim()}...`;
}

function ReadMoreSection({ title, text, variant = "card", onReadMore }: { title: string; text: string; variant?: SectionVariant; onReadMore: (section: TextModal) => void }) {
  const isLarge = variant === "large";
  const limit = isLarge ? 520 : 260;
  return (
    <article className={variant === "large" ? "lg:col-span-2" : variant === "compact" ? "" : "rounded-lg border border-stone-200 bg-white p-5"}>
      <h2 className={isLarge ? "text-2xl font-black" : "font-black"}>{title}</h2>
      <p className={`${isLarge ? "mt-4" : "mt-2"} whitespace-pre-wrap leading-7 text-stone-700 ${isLarge ? "lg:leading-8" : ""}`}>{previewText(text, limit)}</p>
      {text.trim().length > limit && (
        <button type="button" className="mt-3 text-sm font-black text-forest hover:text-green-800" onClick={() => onReadMore({ title, text })}>
          Read more
        </button>
      )}
    </article>
  );
}

function FillImageButton({ item, alt, onOpen }: { item: SellerMediaItem; alt: string; onOpen: (image: ImageModal) => void }) {
  return (
    <button type="button" className="group absolute inset-0 block w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-gold" onClick={() => onOpen({ src: mediaUrl(item), alt })} aria-label={`Open ${alt}`}>
      <Image unoptimized src={mediaUrl(item)} alt={alt} fill className="object-cover transition-transform duration-200 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, 100vw" />
    </button>
  );
}

export function SellerProfileDetails({ seller }: SellerProfileDetailsProps) {
  const [textModal, setTextModal] = useState<TextModal | null>(null);
  const [imageModal, setImageModal] = useState<ImageModal | null>(null);
  const profileImage = seller.media.find((item) => item.mediaType === "PROFILE") ?? seller.media[0];
  const logo = seller.media.find((item) => item.mediaType === "LOGO");
  const gallery = seller.media.filter((item) => item.mediaType === "GALLERY");
  const activeModal = textModal || imageModal;
  const location = [seller.city, seller.region].filter(Boolean).join(", ");
  const details = [seller.category, location].filter(Boolean).join(" - ");
  const detailSections: TextModal[] = [
    { title: "Achievements", text: seller.achievements ?? "" },
    { title: "Business Impact", text: seller.communityImpact ?? "" },
    { title: "Future Goals", text: seller.futureGoals ?? "" },
    { title: "Investment or Sponsorship Use", text: seller.useOfFunds ?? "" }
  ].filter((section) => section.text.trim().length > 0);

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTextModal(null);
        setImageModal(null);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeModal]);

  return (
    <>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <div className="grid content-start gap-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
            {profileImage && <FillImageButton item={profileImage} alt={`${seller.businessName} entrepreneur profile`} onOpen={setImageModal} />}
          </div>
          {logo && (
            <button type="button" className="h-20 w-20 rounded-md border border-stone-200 bg-white p-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold" onClick={() => setImageModal({ src: mediaUrl(logo), alt: `${seller.businessName} logo` })} aria-label={`Open ${seller.businessName} logo`}>
              <Image unoptimized src={mediaUrl(logo, true)} alt={`${seller.businessName} logo`} width={80} height={80} className="h-full w-full object-contain" />
            </button>
          )}
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-forest">{seller.sellerReferenceId}</p>
          <h1 className="mt-2 text-4xl font-black">{seller.businessName}</h1>
          {details && <p className="mt-2 text-stone-700">{details}</p>}
          {seller.shortSummary && <p className="mt-6 text-lg leading-8 text-stone-700">{seller.shortSummary}</p>}
          <Link className="btn btn-primary mt-6" href={`/investor/contact/${seller.id}`}>Interested in supporting or investing in this entrepreneur?</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        {seller.journeyStory && <ReadMoreSection title="Entrepreneur Journey" text={seller.journeyStory} variant="large" onReadMore={setTextModal} />}
        {(seller.supportNeeded || seller.productsOrServices) && (
          <aside className="grid content-start gap-5 rounded-lg border border-stone-200 bg-stone-50 p-5">
            {seller.supportNeeded && <ReadMoreSection title="Support Required" text={seller.supportNeeded} variant="compact" onReadMore={setTextModal} />}
            {seller.productsOrServices && <ReadMoreSection title="Products or Services" text={seller.productsOrServices} variant="compact" onReadMore={setTextModal} />}
          </aside>
        )}
        {detailSections.map((section) => <ReadMoreSection key={section.title} title={section.title} text={section.text} onReadMore={setTextModal} />)}
      </div>

      {gallery.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black">Business Gallery</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <div key={item.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
                <FillImageButton item={item} alt={item.originalFileName} onOpen={setImageModal} />
              </div>
            ))}
          </div>
        </div>
      )}

      {textModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="seller-section-modal-title" onMouseDown={() => setTextModal(null)}>
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 id="seller-section-modal-title" className="text-2xl font-black">{textModal.title}</h2>
              <button type="button" className="rounded-md border border-stone-300 px-3 py-1 text-sm font-black text-stone-700 hover:bg-stone-50" onClick={() => setTextModal(null)}>Close</button>
            </div>
            <p className="mt-5 whitespace-pre-wrap leading-8 text-stone-700">{textModal.text}</p>
          </div>
        </div>
      )}

      {imageModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 py-6" role="dialog" aria-modal="true" aria-label={imageModal.alt} onMouseDown={() => setImageModal(null)}>
          <div className="relative max-h-[90vh] w-full max-w-5xl" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="absolute right-0 top-0 z-10 rounded-md bg-white px-3 py-1 text-sm font-black text-stone-800 shadow hover:bg-stone-100" onClick={() => setImageModal(null)}>Close</button>
            <div className="relative mt-10 max-h-[82vh] overflow-hidden rounded-lg bg-stone-950">
              <Image unoptimized src={imageModal.src} alt={imageModal.alt} width={1200} height={900} className="max-h-[82vh] w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
