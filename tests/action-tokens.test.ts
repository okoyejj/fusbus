// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createActionToken, verifyActionToken } from "@/lib/action-tokens";
import { passwordSchema } from "@/lib/validation";
afterEach(() => vi.unstubAllEnvs());
describe("account action tokens", () => {
  it("binds tokens to an account, purpose, expiry and current password", () => {
    vi.stubEnv("SESSION_SECRET", "a-test-secret-with-at-least-32-characters");
    const account = { id: "seller", passwordHash: "hash" };
    const token = createActionToken(account, "reset-password", 1000);
    expect(verifyActionToken(token, account, "reset-password", 1001)).toBe(true);
    expect(verifyActionToken(token, { ...account, id: "victim" }, "reset-password", 1001)).toBe(false);
    expect(verifyActionToken(token, { ...account, passwordHash: "new-hash" }, "reset-password", 1001)).toBe(false);
    expect(verifyActionToken(token, account, "verify-email", 1001)).toBe(false);
    expect(verifyActionToken(token, account, "reset-password", 1801000)).toBe(false);
    expect(verifyActionToken(token + "x", account, "reset-password", 1001)).toBe(false);
    expect(verifyActionToken("legacy-shared-token", account, "reset-password", 1001)).toBe(false);
  });
  it("rejects passwords bcrypt would silently truncate", () => {
    expect(passwordSchema.safeParse("ValidPass1" + "a".repeat(63)).success).toBe(false);
    expect(passwordSchema.safeParse("ValidPass1" + "é".repeat(32)).success).toBe(false);
    expect(passwordSchema.safeParse("ValidPass1" + "a".repeat(62)).success).toBe(true);
  });
});
