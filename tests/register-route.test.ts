// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  failedDeleteMany: vi.fn(),
  failedCreate: vi.fn(),
  createSession: vi.fn(),
  hashPassword: vi.fn(),
  queueNotification: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, create: mocks.userCreate },
    failedFormAttempt: { deleteMany: mocks.failedDeleteMany, create: mocks.failedCreate }
  }
}));
vi.mock("@/lib/auth", () => ({ createSession: mocks.createSession, hashPassword: mocks.hashPassword, clientIp: () => "test" }));
vi.mock("@/lib/notifications", () => ({ queueNotification: mocks.queueNotification }));
vi.mock("@/lib/action-tokens", () => ({ createActionToken: () => "verify-token" }));

function request(values: Record<string, string>, accept = "text/html") {
  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return new NextRequest("http://localhost/api/auth/register", { method: "POST", body, headers: { origin: "http://localhost", referer: "http://localhost/seller/register", accept } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_URL", "http://localhost");
  mocks.failedDeleteMany.mockResolvedValue({ count: 0 });
  mocks.failedCreate.mockResolvedValue({});
  mocks.hashPassword.mockResolvedValue("hash");
  mocks.userCreate.mockResolvedValue({ id: "user", email: "seller@example.com", passwordHash: "hash" });
  mocks.queueNotification.mockResolvedValue(undefined);
});

describe("seller registration API", () => {
  it("logs invalid attempts without passwords and prunes retained rows", async () => {
    const response = await POST(request({ fullName: "A", businessName: "", email: " Bad ", password: "weak" }));
    expect(response.status).toBe(303);
    expect(mocks.failedDeleteMany).toHaveBeenCalledWith({ where: { createdAt: { lt: expect.any(Date) } } });
    expect(mocks.failedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        formType: "seller-registration",
        email: "bad",
        fullName: "A",
        businessName: null,
        errorCode: "invalid",
        origin: "http://localhost",
        referer: "http://localhost/seller/register",
        host: "localhost"
      })
    });
    expect(JSON.stringify(mocks.failedCreate.mock.calls[0][0])).not.toContain("weak");
  });

  it("does not log successful registrations", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    const response = await POST(request({ fullName: "Valid Seller", businessName: "Valid Trade", email: "seller@example.com", password: "SellerPass123" }));
    expect(response.status).toBe(303);
    expect(mocks.failedCreate).not.toHaveBeenCalled();
  });
});
