import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createPasswordResetToken } from "@/lib/account-tokens";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  hashPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdateMany: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  clientIp: (request: NextRequest) => request.headers.get("x-forwarded-for") ?? "unknown",
  createSession: mocks.createSession,
  hashPassword: mocks.hashPassword
}));

vi.mock("@/lib/account-emails", () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  sendWelcomeEmail: mocks.sendWelcomeEmail
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: mocks.userCreate,
      findUnique: mocks.userFindUnique,
      updateMany: mocks.userUpdateMany
    }
  }
}));

import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";

function formRequest(path: string, values: Record<string, string>, ip: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: {
      accept: "text/html",
      "content-type": "application/x-www-form-urlencoded",
      origin: "http://localhost",
      "x-forwarded-for": ip
    },
    body: new URLSearchParams(values)
  });
}

describe("account email routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_URL", "http://localhost");
    process.env.SESSION_SECRET = "a-secure-test-secret-that-is-longer-than-32-characters";
    mocks.createSession.mockResolvedValue(undefined);
    mocks.hashPassword.mockResolvedValue("new-password-hash");
    mocks.sendPasswordResetEmail.mockResolvedValue(undefined);
    mocks.sendWelcomeEmail.mockResolvedValue(undefined);
    mocks.userUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("sends a welcome email populated with the registered seller name", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({ id: "user-new", email: "ada@example.com" });

    const response = await register(formRequest("/api/auth/register", {
      fullName: "Ada Nkem",
      businessName: "Ada Textiles",
      email: "ADA@example.com",
      password: "SecurePass123"
    }, "198.51.100.10"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/seller/application");
    expect(mocks.sendWelcomeEmail).toHaveBeenCalledWith({
      userId: "user-new",
      email: "ada@example.com",
      name: "Ada Nkem"
    });
  });

  it("sends reset instructions for an existing account without exposing account existence", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user-123",
      email: "seller@example.com",
      passwordHash: "old-password-hash",
      sellerProfile: { fullName: "Ada Nkem" }
    });

    const existingResponse = await forgotPassword(formRequest("/api/auth/forgot-password", {
      email: "SELLER@example.com"
    }, "198.51.100.11"));

    expect(existingResponse.status).toBe(303);
    expect(existingResponse.headers.get("location")).toBe("http://localhost/seller/login?notice=reset-requested");
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith({
      userId: "user-123",
      email: "seller@example.com",
      name: "Ada Nkem",
      passwordHash: "old-password-hash"
    });

    mocks.userFindUnique.mockResolvedValue(null);
    const missingResponse = await forgotPassword(formRequest("/api/auth/forgot-password", {
      email: "missing@example.com"
    }, "198.51.100.12"));

    expect(missingResponse.status).toBe(existingResponse.status);
    expect(missingResponse.headers.get("location")).toBe(existingResponse.headers.get("location"));
  });

  it("changes the password once when given a valid account-bound token", async () => {
    const user = { id: "user-123", email: "seller@example.com", passwordHash: "old-password-hash" };
    const token = createPasswordResetToken(user);
    mocks.userFindUnique.mockResolvedValue(user);

    const response = await resetPassword(formRequest("/api/auth/reset-password", {
      token,
      password: "NewSecurePass123",
      confirmPassword: "NewSecurePass123"
    }, "198.51.100.13"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/seller/login?notice=password-reset");
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { id: user.id, passwordHash: user.passwordHash, isActive: true, deletedAt: null },
      data: { passwordHash: "new-password-hash", failedLogins: 0, lockedUntil: null }
    });
  });

  it("rejects mismatched confirmation and an already-used reset token", async () => {
    const user = { id: "user-123", email: "seller@example.com", passwordHash: "old-password-hash" };
    const token = createPasswordResetToken(user);
    mocks.userFindUnique.mockResolvedValue(user);

    const mismatch = await resetPassword(formRequest("/api/auth/reset-password", {
      token,
      password: "NewSecurePass123",
      confirmPassword: "DifferentPass123"
    }, "198.51.100.14"));
    expect(mismatch.headers.get("location")).toBe("http://localhost/seller/reset-password?token=" + encodeURIComponent(token) + "&error=mismatch");

    mocks.userUpdateMany.mockResolvedValue({ count: 0 });
    const reused = await resetPassword(formRequest("/api/auth/reset-password", {
      token,
      password: "NewSecurePass123",
      confirmPassword: "NewSecurePass123"
    }, "198.51.100.15"));
    expect(reused.headers.get("location")).toBe("http://localhost/seller/reset-password?error=reset-invalid");
  });
});
