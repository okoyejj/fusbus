// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { publicOrigin, requireSameOrigin, resolveInside } from "@/lib/security";
vi.mock("@/lib/auth", () => ({ clientIp: () => "test" }));
afterEach(() => vi.unstubAllEnvs());
describe("request and filesystem boundaries", () => {
  it("accepts the configured public origin behind a proxy", () => {
    vi.stubEnv("APP_URL", "https://fusbus.test");
    expect(requireSameOrigin(new NextRequest("http://app:3000/api", { method: "POST", headers: { origin: "https://fusbus.test" } }))).toBeNull();
  });
  it("does not trust an attacker-supplied forwarded host", () => {
    vi.stubEnv("APP_URL", "https://fusbus.test");
    const request = new NextRequest("http://app:3000/api", { method: "POST", headers: { origin: "https://evil.test", "x-forwarded-host": "evil.test" } });
    expect(publicOrigin(request)).toBe("https://fusbus.test");
    expect(requireSameOrigin(request)?.status).toBe(403);
  });
  it("rejects missing origin metadata and escaping storage paths", () => {
    expect(requireSameOrigin(new NextRequest("http://localhost/api", { method: "POST" }))?.status).toBe(403);
    expect(() => resolveInside("/tmp/uploads", "../../secret")).toThrow();
    expect(resolveInside("/tmp/uploads", "seller/image.webp")).toBe("/tmp/uploads/seller/image.webp");
  });
});

it("blocks direct legacy uploads at the application boundary", () => {
  expect(proxy().status).toBe(404);
});
