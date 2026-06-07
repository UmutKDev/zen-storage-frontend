import { test, expect } from "@playwright/test";

/**
 * Phase 2 account routes live inside the protected `(app)` group. Unauthenticated
 * access must redirect to /login (route protection in `proxy.ts`). The full
 * authenticated walkthrough (shell, tabs, theme persistence) is verified against
 * the live backend — see the Phase 2 close-out notes.
 */
const PROTECTED_ROUTES = [
  "/account",
  "/account/profile",
  "/account/security",
  "/account/subscription",
];

for (const path of PROTECTED_ROUTES) {
  test(`redirects ${path} to /login when unauthenticated`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}
