import { verifyActionToken } from "@/lib/action-tokens";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formError, formRedirect, requireSameOrigin } from "@/lib/security";

export function GET(request: NextRequest) {
  return formRedirect(request, "/seller/login", { error: "method" });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return formError(request, "/seller/login", "blocked", "For your security, that request could not be verified.", 403);
  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase();
  const token = String(form.get("token") ?? "");
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!email || !user || !user.isActive || user.deletedAt || user.emailVerified || !verifyActionToken(token, user, "verify-email")) return formError(request, "/seller/login", "verify-invalid", "That verification link is invalid or expired.");
  await prisma.user.updateMany({ where: { id: user.id, emailVerified: false }, data: { emailVerified: true } });
  return formRedirect(request, "/seller/login", { notice: "email-verified" });
}
