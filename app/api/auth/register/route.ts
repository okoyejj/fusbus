import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { queueNotification } from "@/lib/notifications";
import { formError, formRedirect, publicOrigin, rateLimit, requireSameOrigin } from "@/lib/security";

export function GET(request: NextRequest) {
  return formRedirect(request, "/seller/register", { error: "method" });
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return formError(request, "/seller/register", "blocked", "For your security, that registration request could not be verified.", 403);
  const limited = rateLimit(request, "register", 5, 60 * 60 * 1000);
  if (limited) return formError(request, "/seller/register", "limited", "Too many registration attempts. Please wait and try again.", 429);
  const body = Object.fromEntries((await request.formData()).entries());
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return formError(request, "/seller/register", "invalid", "Please check the registration form and try again.");
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return formError(request, "/seller/register", "exists", "An account already exists for that email address.", 409);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      role: UserRole.SELLER,
      sellerProfile: {
        create: {
          fullName: parsed.data.fullName,
          businessName: parsed.data.businessName
        }
      }
    }
  });
  await queueNotification({
    userId: user.id,
    type: "SELLER_REGISTRATION",
    subject: "Welcome to FusBus Cameroon",
    message: "Your entrepreneur account has been created. Please complete your onboarding application."
  });
  await createSession(user.id);
  return NextResponse.redirect(new URL("/seller/dashboard", publicOrigin(request)), 303);
}
