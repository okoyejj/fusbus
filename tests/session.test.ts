// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getSessionUser } from "@/lib/auth";
const mocks = vi.hoisted(() => ({ get: vi.fn(), find: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.find } } }));
const secret = "a-test-secret-with-at-least-32-characters";
function token(payload: string) {
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("SESSION_SECRET", secret); });
afterEach(() => vi.unstubAllEnvs());
it("rejects tampered, expired and malformed signed sessions", async () => {
  for (const value of ["bad.token", token("{"), token('{"userId":"user"}'), token('{"userId":"user","expiresAt":0}'), token(JSON.stringify({ userId: "user", expiresAt: Date.now() + 10000 })) + ".extra"]) {
    mocks.get.mockReturnValue({ value });
    expect(await getSessionUser()).toBeNull();
  }
  expect(mocks.find).not.toHaveBeenCalled();
});
it("looks up only active, undeleted accounts for a valid session", async () => {
  mocks.get.mockReturnValue({ value: token(JSON.stringify({ userId: "owner", expiresAt: Date.now() + 10000 })) });
  mocks.find.mockResolvedValue({ id: "owner" });
  expect(await getSessionUser()).toEqual({ id: "owner" });
  expect(mocks.find.mock.calls[0][0].where).toEqual({ id: "owner", isActive: true, deletedAt: null });
});
