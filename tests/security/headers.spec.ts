import { test, expect } from "@playwright/test";

/**
 * Security-headers smoke (security-headers.md §8). Uses the `request` fixture
 * (no browser needed). P0 ships CSP as Report-Only; P7 flips to enforcing
 * `content-security-policy` and this spec's CSP key updates with it.
 */
const routes = ["/", "/storage", "/storage/a/b"];

const must: Record<string, RegExp> = {
  "strict-transport-security": /max-age=63072000.*includeSubDomains.*preload/,
  "content-security-policy-report-only":
    /default-src 'self'[\s\S]*'nonce-[\s\S]*'strict-dynamic'[\s\S]*frame-ancestors 'none'/,
  "permissions-policy":
    /camera=\(\)[\s\S]*microphone=\(\)[\s\S]*interest-cohort=\(\)/,
  "cross-origin-opener-policy": /^same-origin$/,
  "cross-origin-embedder-policy": /^credentialless$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "x-content-type-options": /^nosniff$/,
};

for (const route of routes) {
  test(`security headers on ${route}`, async ({ request }) => {
    const res = await request.get(route);
    const headers = res.headers();
    for (const [name, pattern] of Object.entries(must)) {
      expect(headers[name], name).toMatch(pattern);
    }
    // Per-request nonce must be present.
    expect(headers["content-security-policy-report-only"]).toMatch(
      /'nonce-[A-Za-z0-9+/=]{16,}'/,
    );
  });
}
