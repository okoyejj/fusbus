// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("keeps production upload requests behind application access checks", async () => {
  const config = (await readFile("deploy/Caddyfile", "utf8")).replace(/#.*$/gm, "");
  expect(config).toContain("reverse_proxy app:3000");
  expect(config).not.toMatch(/\bfile_server\b/);
  expect(config).not.toMatch(/handle_path\s+\/uploads/);
});
