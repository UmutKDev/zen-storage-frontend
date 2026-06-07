import { test, expect } from "@playwright/test";

/**
 * Storage browse routes live in the protected `(app)` group. Unauthenticated
 * access (root + a deep-linked folder path) must redirect to /login. The
 * authenticated browse walkthrough is verified against the live backend — see
 * the Stage A close-out notes.
 */
const ROUTES = ["/storage", "/storage/Photos/2026"];

for (const path of ROUTES) {
  test(`redirects ${path} to /login when unauthenticated`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}
