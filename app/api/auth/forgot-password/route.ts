import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/account-emails";
import { formError, formRedirect, rateLimit, requireSameOrigin } from "@/lib/security";

export function GET(request: NextRequest) {
  return formRedirect(request, "/seller/forgot-password", { error: "method" });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return formError(request, "/seller/forgot-password", "blocked", "For your security, that request could not be verified.", 403);
  const limited = rateLimit(request, "forgot-password", 5, 60 * 60 * 1000);
  if (limited) return formError(request, "/seller/forgot-password", "limited", "Too many requests. Please wait and try again.", 429);
  const form = await request.formData();
  const parsedEmail = z.string().trim().email().safeParse(String(form.get("email") ?? "").toLowerCase());
  const user = parsedEmail.success
    ? await prisma.user.findUnique({
        where: { email: parsedEmail.data },
        include: { sellerProfile: { select: { fullName: true } } }
      })
    : null;
  if (user) {
    await sendPasswordResetEmail({
      userId: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.sellerProfile?.fullName ?? "there"
    }).catch((error) => console.error("Unable to send password reset email", error));
  }
  return formRedirect(request, "/seller/login", { notice: "reset-requested" });
}
