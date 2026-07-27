import { expect, test } from "@playwright/test";

test("home page presents the platform message", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Opening Cameroon’s Entrepreneurs to the World" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply as a Seller" })).toBeVisible();
});
