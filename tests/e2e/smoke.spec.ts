import { test, expect } from "@playwright/test";

// Placeholder so the Playwright project resolves and `--list` succeeds. Real
// end-to-end specs (auth, storage, …) are added per phase against a running app.
test.skip("app shell boots (placeholder)", async ({ page }) => {
  await page.goto("/storage");
  await expect(page.getByRole("heading", { name: "Storage" })).toBeVisible();
});
