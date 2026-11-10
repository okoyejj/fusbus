import { NextResponse } from "next/server";

// Legacy disk uploads must also pass the database-backed /api/media access check.
export function proxy() {
  return new NextResponse(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
}

export const config = { matcher: ["/uploads/:path*"] };
