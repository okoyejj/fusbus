import { expect, test } from "@playwright/test";

test("seller can open the forgot-password request form", async ({ page }) => {
  await page.goto("/seller/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();

  await expect(page).toHaveURL(/\/seller\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveAttribute("type", "email");
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
});

test("a reset link presents new-password and confirmation fields", async ({ page }) => {
  await page.goto("/seller/reset-password?token=test-link-token");

  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await expect(page.getByLabel("New password", { exact: true })).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByLabel("Confirm new password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();
});
