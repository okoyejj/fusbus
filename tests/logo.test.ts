// @vitest-environment node
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { expect, it } from "vitest";
it("ships the supplied FusBus logo as a valid landscape image", async () => {
  const bytes = await readFile("public/brand/fusbus-logo.png");
  expect(createHash("sha256").update(bytes).digest("hex")).toBe("81a0d6ba8f47ff8a7336201efd4c8cecf294fd337af0b7933c61979e0d72ab70");
  const info = await sharp(bytes).metadata();
  expect(info.width).toBeGreaterThan(info.height!);
  expect(info.format).toBe("png");
});
