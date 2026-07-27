import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
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
  const email = String(form.get("email") ?? "").toLowerCase();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const expectedToken = process.env.RESET_PASSWORD_TOKEN;
  const parsed = passwordSchema.safeParse(password);
  if (!email || !expectedToken || token !== expectedToken || !parsed.success) return formError(request, "/seller/login", "reset-invalid", "That password reset link is invalid or expired.");
  await prisma.user.update({ where: { email }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } });
  return formRedirect(request, "/seller/login", { notice: "password-reset" });
}
