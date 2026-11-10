// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/seller/profile/route";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser, clientIp: () => "test" }));
vi.mock("@/lib/prisma", () => ({ prisma: { sellerProfile: { findUnique: mocks.findUnique, upsert: mocks.upsert } } }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/notifications", () => ({ queueNotification: vi.fn().mockResolvedValue(undefined) }));
const valid = { fullName: "Seller Name", businessName: "Business Name", city: "Douala", region: "Littoral", category: "Agriculture", productsOrServices: "Cocoa", businessStage: "Growing", supportNeeded: "Investment", consentReview: "on", consentPublish: "on" };
function request(values: Record<string, string>, origin = "http://localhost") {
  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return new NextRequest("http://localhost/api/seller/profile", { method: "POST", body, headers: { origin, accept: "application/json" } });
}
beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_URL", "http://localhost");
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "owner", role: "SELLER" });
  mocks.findUnique.mockResolvedValue(null);
  mocks.upsert.mockImplementation(async (args) => ({ id: "profile", ...args.update }));
});
describe("seller save and submit API", () => {
  it("saves an incomplete draft then completes it later", async () => {
    expect((await POST(request({ fullName: "Seller", businessName: "", intent: "draft" }))).status).toBe(200);
    const draft = mocks.upsert.mock.calls[0][0].update;
    expect(draft.applicationStatus).toBe("DRAFT");
    mocks.findUnique.mockResolvedValue({ id: "profile", ...draft });
    const response = await POST(request({ ...valid, intent: "submit", fundingAmount: "12.34" }));
    expect(await response.json()).toEqual({ ok: true, submitted: true });
    expect(mocks.upsert.mock.calls[1][0].update.applicationStatus).toBe("SUBMITTED");
  });
  it("saves valid draft values when submission is incomplete", async () => {
    const response = await POST(request({ fullName: "Seller", businessName: "", intent: "submit" }));
    expect(response.status).toBe(422);
    expect((await response.json()).draftSaved).toBe(true);
  });
  it("returns field errors instead of a database overflow", async () => {
    const response = await POST(request({ ...valid, intent: "submit", fundingAmount: "10000000000" }));
    expect(response.status).toBe(422);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("uses the authenticated owner and treats SQL-shaped input as a value", async () => {
    const text = "Robert'); DROP TABLE User;--";
    await POST(request({ ...valid, businessName: text, userId: "victim", applicationStatus: "APPROVED", intent: "draft" }));
    const args = mocks.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "owner" });
    expect(args.update.businessName).toBe(text);
    expect(args.update.applicationStatus).toBe("DRAFT");
    expect(args.update).not.toHaveProperty("userId");
  });
  it("blocks cross-site writes before authentication or persistence", async () => {
    expect((await POST(request(valid, "https://evil.test"))).status).toBe(403);
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });
  it("returns 401 for an expired session", async () => {
    mocks.requireUser.mockRejectedValue(Object.assign(new Error("Unauthorized"), { status: 401 }));
    expect((await POST(request(valid))).status).toBe(401);
  });
  it("handles database lookup failure without an uncaught exception", async () => {
    mocks.findUnique.mockRejectedValue(new Error("offline"));
    expect((await POST(request(valid))).status).toBe(500);
  });
});
