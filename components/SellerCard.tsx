import Image from "next/image";
import Link from "next/link";

type SellerCardProps = {
  seller: {
    id: string;
    sellerReferenceId: string | null;
    fullName: string;
    businessName: string;
    city: string | null;
    category: string | null;
    shortSummary: string | null;
    isFeatured: boolean;
    media?: { mediaType: string; fileUrl: string; thumbnailUrl: string | null; originalFileName: string }[];
  };
};

export function SellerCard({ seller }: SellerCardProps) {
  const image = seller.media?.find((item) => item.mediaType === "PROFILE") ?? seller.media?.[0];
  return (
    <article className="grid overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="relative aspect-[4/3] bg-stone-100">
        {image ? (
          <Image src={image.thumbnailUrl ?? image.fileUrl} alt={`${seller.businessName} entrepreneur profile`} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50 text-forest">
            <span className="text-4xl font-black">{seller.businessName.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {seller.isFeatured && <span className="badge bg-gold text-ink">Featured</span>}
          {seller.category && <span className="badge bg-green-50 text-forest">{seller.category}</span>}
        </div>
        <div>
          <h2 className="text-xl font-black text-ink">{seller.businessName}</h2>
          <p className="text-sm text-stone-600">{seller.fullName} · {seller.city ?? "Cameroon"}</p>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-stone-700">{seller.shortSummary}</p>
        <p className="text-xs font-bold uppercase tracking-normal text-stone-500">Entrepreneur ref: {seller.sellerReferenceId}</p>
        <Link className="btn btn-primary" href={`/sellers/${seller.id}`}>
          View Profile
        </Link>
      </div>
    </article>
  );
}
