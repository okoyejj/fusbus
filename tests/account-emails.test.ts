import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notificationUpdate: vi.fn(),
  queueNotification: vi.fn(),
  sendEmail: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { update: mocks.notificationUpdate } }
}));

vi.mock("@/lib/notifications", () => ({
  queueNotification: mocks.queueNotification
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail
}));

import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/account-emails";

describe("account email orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_URL = "https://fusbus.org";
    process.env.SESSION_SECRET = "a-secure-test-secret-that-is-longer-than-32-characters";
    mocks.queueNotification.mockResolvedValue({ id: "notification-1" });
    mocks.notificationUpdate.mockResolvedValue({});
    mocks.sendEmail.mockResolvedValue({ messageId: "message-1" });
  });

  it("sends and marks a welcome notification delivered", async () => {
    await sendWelcomeEmail({ userId: "user-1", email: "ada@example.com", name: "Ada Nkem" });

    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "ada@example.com",
      subject: "Welcome to FusBus Cameroon",
      html: expect.stringContaining("https://fusbus.org/brand/fusbus-logo.png")
    }));
    expect(mocks.notificationUpdate).toHaveBeenCalledWith({
      where: { id: "notification-1" },
      data: { status: "SENT", sentAt: expect.any(Date) }
    });
  });

  it("does not store the reset token and marks failed delivery", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("SMTP unavailable"));

    await expect(sendPasswordResetEmail({
      userId: "user-1",
      email: "ada@example.com",
      name: "Ada Nkem",
      passwordHash: "current-password-hash"
    })).rejects.toThrow("SMTP unavailable");

    const queued = mocks.queueNotification.mock.calls[0][0] as { message: string };
    expect(queued.message).not.toContain("token=");
    expect(mocks.notificationUpdate).toHaveBeenLastCalledWith({
      where: { id: "notification-1" },
      data: { status: "FAILED" }
    });
  });
});
