import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueNotification } from "@/lib/notifications";
import { formError, formRedirect, rateLimit, requireSameOrigin } from "@/lib/security";

export function GET(request: NextRequest) {
  return formRedirect(request, "/seller/login", { error: "method" });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return formError(request, "/seller/login", "blocked", "For your security, that request could not be verified.", 403);
  const limited = rateLimit(request, "forgot-password", 5, 60 * 60 * 1000);
  if (limited) return formError(request, "/seller/login", "limited", "Too many requests. Please wait and try again.", 429);
  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (user) {
    await queueNotification({
      userId: user.id,
      type: "PASSWORD_RESET_REQUEST",
      subject: "Password reset requested",
      message: "A password reset was requested. Configure a tokenized email provider before production use."
    });
  }
  return formRedirect(request, "/seller/login", { notice: "reset-requested" });
}
