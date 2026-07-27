import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  await clearSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
