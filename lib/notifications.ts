import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId?: string;
  type: string;
  subject: string;
  message: string;
};

export async function queueNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      subject: input.subject,
      message: input.message,
      status: "QUEUED"
    }
  });
}
