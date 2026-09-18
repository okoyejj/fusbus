import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPasswordResetToken, passwordResetSubject, verifyPasswordResetToken } from "@/lib/account-tokens";

const user = {
  id: "user_123",
  email: "seller@example.com",
  passwordHash: "$2a$12$old-password-hash"
};

describe("password reset tokens", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "a-secure-test-secret-that-is-longer-than-32-characters";
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("creates an account-bound token that is valid before expiry", () => {
    const token = createPasswordResetToken(user, 1_000);

    expect(passwordResetSubject(token)).toBe(user.id);
    expect(verifyPasswordResetToken(token, user, 1_000 + 30 * 60 * 1000)).toBe(true);
  });

  it("rejects expired, tampered, and account-mismatched tokens", () => {
    const token = createPasswordResetToken(user, 1_000);
    const otherUser = { ...user, id: "user_456" };

    expect(verifyPasswordResetToken(token, user, 1_000 + 61 * 60 * 1000)).toBe(false);
    expect(verifyPasswordResetToken(`${token}tampered`, user, 2_000)).toBe(false);
    expect(verifyPasswordResetToken(token, otherUser, 2_000)).toBe(false);
  });

  it("invalidates a token after the password hash changes", () => {
    const token = createPasswordResetToken(user, 1_000);

    expect(verifyPasswordResetToken(token, { ...user, passwordHash: "new-password-hash" }, 2_000)).toBe(false);
  });
});
