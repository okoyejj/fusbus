import path from "node:path";
import { expect, test } from "@playwright/test";

test("seller saves a draft, signs in later, uploads an image and submits", async ({ page, context }, testInfo) => {
  const email = `draft-${testInfo.project.name}-${Date.now()}@example.test`;
  const password = "DraftResumePass123!";
  await page.goto("/seller/register");
  await page.getByLabel("Full name", { exact: true }).fill("Draft Seller");
  await page.getByLabel("Business or trading name", { exact: true }).fill("Draft Business");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/seller\/application$/);
  await page.locator('[name="socialLinks"]').fill("https://example.com/my-business");
  await page.locator('[name="fundingAmount"]').fill("12.34");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page).toHaveURL(/\/seller\/dashboard$/);

  await context.clearCookies();
  await page.goto("/seller/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/\/seller\/dashboard$/);
  await page.goto("/seller/application");
  await expect(page.locator('[name="socialLinks"]')).toHaveValue("https://example.com/my-business");
  await expect(page.locator('[name="fundingAmount"]')).toHaveValue("12.34");

  await page.getByLabel("Profile picture", { exact: true }).setInputFiles(path.resolve("public/brand/fusbus-logo.png"));
  await page.getByRole("button", { name: "Upload Profile picture", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Image upload complete");
  const uploaded = page.locator('img[src^="/api/media/"]').first();
  await expect(uploaded).toBeVisible();
  await expect.poll(() => uploaded.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('[name="socialLinks"]')).toHaveValue("https://example.com/my-business");

  await page.locator('[name="city"]').fill("Douala");
  await page.locator('[name="region"]').fill("Littoral");
  await page.locator('[name="category"]').selectOption("Agriculture");
  await page.locator('[name="businessStage"]').selectOption("Growing");
  await page.locator('[name="productsOrServices"]').fill("Cocoa products");
  await page.locator('[name="supportNeeded"]').fill("Packaging investment");
  await page.locator('[name="consentReview"]').check();
  await page.locator('[name="consentPublish"]').check();
  await page.getByRole("button", { name: "Submit for Review", exact: true }).click();
  await expect(page).toHaveURL(/submitted=1/);
  await expect(page.getByRole("heading", { name: "Application submitted", exact: true })).toBeVisible();
});
