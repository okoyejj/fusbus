// @vitest-environment node
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, DELETE } from "@/app/api/seller/media/route";
import { GET } from "@/app/api/media/[id]/route";
import { mediaStoragePath } from "@/lib/media-storage";
import { mediaUrl } from "@/lib/media-url";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), getSessionUser: vi.fn(), profile: vi.fn(), count: vi.fn(), create: vi.fn(), find: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser, getSessionUser: mocks.getSessionUser, clientIp: () => "media-test" }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  sellerProfile: { findUniqueOrThrow: mocks.profile },
  sellerMedia: { findUnique: mocks.find, findMany: mocks.findMany, deleteMany: mocks.deleteMany },
  $transaction: mocks.transaction
} }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn().mockResolvedValue(undefined) }));
let root: string;
let record: Record<string, unknown>;
const profile = { id: "profile", userId: "owner", media: [], applicationStatus: "DRAFT", consentPublish: true, deletedAt: null, user: { isActive: true, deletedAt: null } };
beforeEach(async () => {
  vi.clearAllMocks();
  root = await mkdtemp(path.join(os.tmpdir(), "fusbus-media-"));
  vi.stubEnv("PRIVATE_UPLOAD_DIR", root);
  vi.stubEnv("APP_URL", "http://localhost");
  mocks.requireUser.mockResolvedValue({ id: "owner", role: "SELLER" });
  mocks.getSessionUser.mockResolvedValue({ id: "owner", role: "SELLER" });
  mocks.profile.mockResolvedValue(profile);
  mocks.count.mockResolvedValue(0);
  mocks.create.mockImplementation(async ({ data }) => { record = { ...data, sellerProfile: profile }; return record; });
  mocks.find.mockImplementation(async () => record);
  mocks.transaction.mockImplementation(async (fn) => fn({ sellerMedia: { count: mocks.count, create: mocks.create, deleteMany: mocks.deleteMany } }));
});
afterEach(async () => { vi.unstubAllEnvs(); await rm(root, { recursive: true, force: true }); });
async function upload(files?: File[]) {
  const png = await sharp({ create: { width: 20, height: 10, channels: 3, background: "red" } }).png().toBuffer();
  const body = new FormData();
  body.set("mediaType", "GALLERY");
  for (const file of files ?? [new File([png], "camera.png", { type: "image/png" })]) body.append("files", file);
  return POST(new NextRequest("http://localhost/api/seller/media", { method: "POST", body, headers: { origin: "http://localhost", accept: "application/json" } }));
}
function getImage(thumbnail = false) {
  return GET(new NextRequest(`http://localhost/api/media/image${thumbnail ? "?thumbnail=1" : ""}`), { params: Promise.resolve({ id: "image" }) });
}
describe("image upload and access", () => {
  it("uploads real pixels and serves original and thumbnail to the owner", async () => {
    expect((await upload()).status).toBe(200);
    expect(record.fileUrl).toMatch(/^\/api\/media\//);
    expect(record.isPublic).toBe(false);
    for (const thumbnail of [false, true]) {
      const response = await getImage(thumbnail);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format).toBe("webp");
    }
  });
  it("compresses a complex accepted image below 1 MB", async () => {
    const width = 1400;
    const source = await sharp(randomBytes(width * width * 3), { raw: { width, height: width, channels: 3 } }).jpeg({ quality: 100 }).toBuffer();
    expect(source.byteLength).toBeGreaterThan(1_000_000);
    expect(source.byteLength).toBeLessThanOrEqual(5 * 1024 * 1024);

    expect((await upload([new File([source], "large-photo.jpg", { type: "image/jpeg" })])).status).toBe(200);
    expect(record.fileSize).toBeLessThan(1_000_000);
  });
  it("rejects an image above 5 MB with the image-too-large error", async () => {
    const tooLarge = new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "too-large.jpg", { type: "image/jpeg" });
    const response = await upload([tooLarge]);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "size" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("denies anonymous users and other sellers but permits admins", async () => {
    await upload();
    mocks.getSessionUser.mockResolvedValue(null);
    expect((await getImage()).status).toBe(404);
    mocks.getSessionUser.mockResolvedValue({ id: "someone-else", role: "SELLER" });
    expect((await getImage()).status).toBe(404);
    mocks.getSessionUser.mockResolvedValue({ id: "admin", role: "ADMIN" });
    expect((await getImage()).status).toBe(200);
  });
  it("serves only approved public images and revokes access when suspended", async () => {
    await upload();
    record.isPublic = true;
    record.sellerProfile = { ...profile, applicationStatus: "APPROVED" };
    mocks.getSessionUser.mockResolvedValue(null);
    expect((await getImage()).status).toBe(200);
    record.sellerProfile = { ...profile, applicationStatus: "SUSPENDED" };
    expect((await getImage()).status).toBe(404);
  });
  it("falls back to a legacy original and reports its real type when the thumbnail is missing", async () => {
    const legacyRoot = path.join(root, "legacy-uploads");
    const sellerRoot = path.join(legacyRoot, "profile");
    const png = await sharp({ create: { width: 20, height: 10, channels: 3, background: "blue" } }).png().toBuffer();
    await mkdir(sellerRoot, { recursive: true });
    await writeFile(path.join(sellerRoot, "photo.png"), png);
    vi.stubEnv("UPLOAD_DIR", legacyRoot);
    record = {
      id: "image",
      sellerProfileId: "profile",
      storedFileName: "photo.png",
      fileUrl: "/uploads/profile/photo.png",
      thumbnailUrl: "/uploads/profile/missing-thumb.png",
      mimeType: "image/webp",
      isPublic: true,
      sellerProfile: { ...profile, applicationStatus: "APPROVED" }
    };
    mocks.getSessionUser.mockResolvedValue(null);

    const response = await getImage(true);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format).toBe("png");
  });
  it("removes partial files when a later image has forged MIME content", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().toBuffer();
    const response = await upload([new File([png], "valid.png"), new File(["<script>bad</script>"], "fake.png", { type: "image/png" })]);
    expect(response.status).toBe(400);
    expect(await readdir(path.join(root, "seller-images/profile"))).toEqual([]);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("cleans files after database failures", async () => {
    mocks.transaction.mockRejectedValue(new Error("offline"));
    expect((await upload()).status).toBe(500);
    expect(await readdir(path.join(root, "seller-images/profile"))).toEqual([]);
  });
  it("rechecks gallery capacity within the serializable transaction", async () => {
    mocks.count.mockResolvedValue(5);
    expect((await upload()).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
    expect(await readdir(path.join(root, "seller-images/profile"))).toEqual([]);
  });
  it("rejects oversized streamed bodies without relying on content-length", async () => {
    vi.stubEnv("MAX_UPLOAD_REQUEST_MB", "0.0001");
    expect((await upload()).status).toBe(413);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("scopes deletions to the signed-in seller", async () => {
    mocks.findMany.mockResolvedValue([]);
    const response = await DELETE(new NextRequest("http://localhost/api/seller/media?id=other-image", { method: "DELETE", headers: { origin: "http://localhost", accept: "application/json" } }));
    expect(response.status).toBe(404);
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({ id: "other-image", sellerProfileId: "profile" });
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });
  it("rewrites legacy URLs and leaves seeded public assets intact", () => {
    expect(mediaUrl({ id: "old", fileUrl: "/uploads/p/a.webp", thumbnailUrl: null }, true)).toBe("/api/media/old?thumbnail=1");
    expect(mediaUrl({ id: "seed", fileUrl: "/sellers/photo.png", thumbnailUrl: null })).toBe("/sellers/photo.png");
    expect(() => mediaStoragePath({ sellerProfileId: "p", storedFileName: "a.webp", fileUrl: "/uploads/../../secret", thumbnailUrl: null })).toThrow();
  });
});
