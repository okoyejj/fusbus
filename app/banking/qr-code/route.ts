import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { bankingPageUrl } from "@/lib/payment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const destination = bankingPageUrl(request.nextUrl.origin);
  const svg = await QRCode.toString(destination, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 3,
    width: 720,
    color: { dark: "#163d2a", light: "#ffffff" }
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": 'inline; filename="fusbus-banking-qr.svg"',
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
