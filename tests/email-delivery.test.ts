import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, sendMail } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn()
}));

vi.mock("nodemailer", () => ({
  default: { createTransport }
}));

import { sendEmail } from "@/lib/email";

describe("SMTP email delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTransport.mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({ messageId: "message-123" });
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "info@fusbus.org";
    process.env.SMTP_PASS = "test-only-password";
  });

  it("sends branded messages from info@fusbus.org over authenticated SMTP", async () => {
    await sendEmail({
      to: "seller@example.com",
      subject: "Welcome",
      text: "Welcome to FusBus",
      html: "<p>Welcome to FusBus</p>"
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "info@fusbus.org", pass: "test-only-password" }
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: '"FusBus" <info@fusbus.org>',
      to: "seller@example.com"
    }));
  });

  it("fails clearly when SMTP configuration is incomplete", async () => {
    delete process.env.SMTP_PASS;

    await expect(sendEmail({ to: "seller@example.com", subject: "Test", text: "Test", html: "<p>Test</p>" }))
      .rejects.toThrow("SMTP configuration is incomplete");
    expect(createTransport).not.toHaveBeenCalled();
  });
});
