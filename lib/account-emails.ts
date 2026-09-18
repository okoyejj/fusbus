import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/account-tokens";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, welcomeEmail, type EmailContent } from "@/lib/email-templates";
import { queueNotification } from "@/lib/notifications";

function applicationUrl(path: string) {
  const baseUrl = process.env.APP_URL;
  if (!baseUrl) throw new Error("APP_URL must be configured to send account emails.");
  return new URL(path, baseUrl).toString();
}

async function deliver(input: {
  userId: string;
  email: string;
  type: string;
  content: EmailContent;
  notificationMessage: string;
}) {
  const notification = await queueNotification({
    userId: input.userId,
    type: input.type,
    subject: input.content.subject,
    message: input.notificationMessage
  });

  try {
    await sendEmail({ to: input.email, ...input.content });
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date() }
    });
  } catch (error) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED" }
    }).catch(() => undefined);
    throw error;
  }
}

export async function sendWelcomeEmail(input: { userId: string; email: string; name: string }) {
  return deliver({
    userId: input.userId,
    email: input.email,
    type: "SELLER_REGISTRATION",
    notificationMessage: "Welcome email sent after entrepreneur registration.",
    content: welcomeEmail({
      name: input.name,
      applicationUrl: applicationUrl("/seller/application"),
      logoUrl: applicationUrl("/brand/fusbus-logo.png")
    })
  });
}

export async function sendPasswordResetEmail(input: {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
}) {
  const resetUrl = new URL("/seller/reset-password", applicationUrl("/"));
  resetUrl.searchParams.set("token", createPasswordResetToken({
    id: input.userId,
    email: input.email,
    passwordHash: input.passwordHash
  }));

  return deliver({
    userId: input.userId,
    email: input.email,
    type: "PASSWORD_RESET_REQUEST",
    notificationMessage: "Password reset instructions requested. The secure token is not stored in this notification.",
    content: passwordResetEmail({
      name: input.name,
      resetUrl: resetUrl.toString(),
      logoUrl: applicationUrl("/brand/fusbus-logo.png")
    })
  });
}
