import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { passwordResetSubject, verifyPasswordResetToken } from "@/lib/account-tokens";
import { passwordSchema } from "@/lib/validation";
import { formError, formRedirect, rateLimit, requireSameOrigin } from "@/lib/security";

export function GET(request: NextRequest) {
  return formRedirect(request, "/seller/login", { error: "method" });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return formError(request, "/seller/login", "blocked", "For your security, that request could not be verified.", 403);
  const limited = rateLimit(request, "reset-password", 5, 60 * 60 * 1000);
  if (limited) return formError(request, "/seller/login", "limited", "Too many requests. Please wait and try again.", 429);
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (password !== confirmPassword) {
    return formError(request, `/seller/reset-password?token=${encodeURIComponent(token)}`, "mismatch", "The passwords do not match.");
  }
  if (!parsed.success) {
    return formError(request, `/seller/reset-password?token=${encodeURIComponent(token)}`, "password-invalid", "Choose a stronger password.");
  }

  const userId = passwordResetSubject(token);
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (!user || !verifyPasswordResetToken(token, user)) {
    return formError(request, "/seller/reset-password", "reset-invalid", "That password reset link is invalid or expired.");
  }

  const updated = await prisma.user.updateMany({
    where: { id: user.id, passwordHash: user.passwordHash, isActive: true, deletedAt: null },
    data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null }
  });
  if (updated.count !== 1) {
    return formError(request, "/seller/reset-password", "reset-invalid", "That password reset link is invalid or expired.");
  }
  return formRedirect(request, "/seller/login", { notice: "password-reset" });
}
