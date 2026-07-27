import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { formRedirect, publicOrigin, rateLimit, requireSameOrigin } from "@/lib/security";

function loginRedirect(request: NextRequest, reason = "invalid") {
  const fallback = new URL("/seller/login", publicOrigin(request));
  const referer = request.headers.get("referer");
  const url = referer ? new URL(referer) : fallback;
  if (url.origin !== fallback.origin || !url.pathname.endsWith("/login")) {
    url.pathname = "/seller/login";
  }
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url, 303);
}

export function GET(request: NextRequest) {
  return formRedirect(request, "/seller/login", { error: "method" });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return loginRedirect(request, "blocked");
  const body = Object.fromEntries((await request.formData()).entries());
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return loginRedirect(request);
  const limited = rateLimit(request, `login:${parsed.data.email.toLowerCase()}`, 8, 15 * 60 * 1000);
  if (limited) return loginRedirect(request, "limited");
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive || user.deletedAt) {
    return loginRedirect(request);
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return loginRedirect(request, "locked");
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    const failedLogins = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins,
        lockedUntil: failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
      }
    });
    return loginRedirect(request);
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(user.id);
  return NextResponse.redirect(new URL(user.role === "ADMIN" ? "/admin" : "/seller/dashboard", publicOrigin(request)), 303);
}
