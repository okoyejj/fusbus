import { describe, expect, it } from "vitest";
import { passwordResetEmail, welcomeEmail } from "@/lib/email-templates";

const logoUrl = "https://fusbus.org/brand/fusbus-logo.png";

describe("account email templates", () => {
  it("renders a polite, branded welcome email with the recipient name", () => {
    const email = welcomeEmail({
      name: "Ada Nkem",
      applicationUrl: "https://fusbus.org/seller/application",
      logoUrl
    });

    expect(email.subject).toBe("Welcome to FusBus Cameroon");
    expect(email.text).toContain("Hello Ada Nkem");
    expect(email.text).toContain("Thank you for registering");
    expect(email.html).toContain("Hello Ada Nkem");
    expect(email.html).toContain(logoUrl);
    expect(email.html).toContain("FusBus");
  });

  it("renders a polite, branded password reset email and escapes user content", () => {
    const email = passwordResetEmail({
      name: '<script>alert("xss")</script>',
      resetUrl: "https://fusbus.org/seller/reset-password?token=safe-token",
      logoUrl
    });

    expect(email.subject).toBe("Reset your FusBus password");
    expect(email.text).toContain("reset your FusBus password");
    expect(email.html).toContain(logoUrl);
    expect(email.html).toContain("safe-token");
    expect(email.html).not.toContain("<script>");
  });
});
