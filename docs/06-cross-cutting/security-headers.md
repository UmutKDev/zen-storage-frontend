# Cross‑cutting — Security headers

> The browser‑side defense layer: CSP, HSTS, Permissions‑Policy, COOP/COEP, and iframe sandboxing for previews.
> Frontend‑only concern (backend has its own headers on the API origin). Baseline lands in
> [Phase 0](../01-roadmap/phases/phase-0-foundation.md), tightened in [Phase 4](../01-roadmap/phases/phase-4-preview-share.md)
> (preview sandbox + CDN allowances), verified in [Phase 7](../01-roadmap/phases/phase-7-public-polish.md).

## 1. Where headers are set

- All response headers are emitted from `proxy.ts` (the ~5‑line shim — Next 16.2 rename of `middleware.ts`; exports `proxy`) → `lib/security/headers.ts`.
- No header configuration in `next.config.*` — keeping it in `proxy.ts` lets us inject the per‑request **CSP nonce**.
- Static export routes (if any) inherit the same headers from the edge.
- The backend (`nestjs-storage`) sets its own CORS/headers on `api.storage.umutk.me`; this doc covers only the
  Next.js origin.

## 2. Content‑Security‑Policy (nonce‑based)

Strict, **nonce‑per‑request** CSP. No `'unsafe-inline'` for scripts, no `'unsafe-eval'`. Hashes for the small
critical inline bootstrap if needed.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
  style-src 'self' 'nonce-{NONCE}';
  img-src 'self' data: blob: https://cdn.storage.umutk.me;
  font-src 'self' data:;
  connect-src 'self' https://api.storage.umutk.me https://cdn.storage.umutk.me wss://api.storage.umutk.me https://*.s3.amazonaws.com;
  media-src 'self' blob: https://cdn.storage.umutk.me;
  worker-src 'self' blob:;
  frame-src 'self' blob:;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests;
  report-uri /api/csp-report;
```

Notes:
- **`connect-src`** must list every host the [Instance](../02-architecture/data-layer.md) talks to *plus* the
  presigned S3 hosts used by the [upload pipeline](../02-architecture/upload-pipeline.md). Wildcard the S3 region as
  needed; do not blanket `https:`.
- **`img-src`** includes the CDN (`cdn.storage.umutk.me` → wsrv.nl) used by the
  [performance image strategy](./performance.md#2-techniques).
- **`frame-ancestors 'none'`** replaces `X-Frame-Options: DENY` (CSP wins where both are set).
- Nonce is generated per request (32 bytes, base64), threaded into the React tree via a server context, and read by
  `<Script nonce>` / inline `<style nonce>` only where unavoidable.
- Initial rollout uses **`Content-Security-Policy-Report-Only`** in dev/staging for one phase before flipping to
  enforce in production.

## 3. HSTS

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- 2‑year max‑age, subdomains included, preload eligible. Only emit on production hostnames (not localhost).
- Preload submission happens after Phase 7 (decision pending — see [Open items](#9-open-items)).

## 4. Permissions‑Policy

Deny‑by‑default for anything the app does not need. Re‑enable per feature as it ships.

```
Permissions-Policy:
  accelerometer=(),
  camera=(),
  geolocation=(),
  gyroscope=(),
  magnetometer=(),
  microphone=(),
  payment=(),
  usb=(),
  interest-cohort=(),
  clipboard-read=(self),
  clipboard-write=(self),
  fullscreen=(self)
```

- `clipboard-read/write=(self)` is required for copy‑link in [sharing](../04-features/sharing.md) and for the
  preview "copy contents" affordance.
- `fullscreen=(self)` supports the image/video preview fullscreen mode.
- `interest-cohort=()` opts out of FLoC/Topics.

## 5. COOP / COEP / CORP

| Header | Value | Why |
|---|---|---|
| `Cross-Origin-Opener-Policy` | `same-origin` | Process isolation; mitigates XS‑Leaks. |
| `Cross-Origin-Embedder-Policy` | **(not set)** | **Removed (D-P4.6).** Any COEP — including `credentialless` — blocks the §6 cross‑origin **preview iframes** (CDN PDF, Microsoft Office viewer). `credentialless` only relaxes no‑cors **subresources** (CDN images load fine), NOT nested iframes, and we can't make the CDN / Microsoft send COEP. The app uses no `SharedArrayBuffer` / cross‑origin isolation, so COEP gained nothing. |
| `Cross-Origin-Resource-Policy` | `same-site` | App routes; CDN responses are governed by the CDN. |

- **No COEP** — it is fundamentally incompatible with embedding the cross‑origin preview iframes this phase needs (§6).
  The bug was masked pre‑Phase‑4 (no iframes) and surfaced in dev (STATIC_HEADERS apply in dev; CSP is prod‑only).
- If we ever need `SharedArrayBuffer` (e.g. a Wasm preview pipeline) we revisit — but it would require `require-corp`
  **and** moving every cross‑origin preview to a same‑origin proxy (blob/stream), since third‑party iframes can't carry COEP.

## 6. Preview iframe sandbox

The [preview](../04-features/preview.md) renders untrusted content (PDFs, HTML‑ish documents, office conversions).
Every preview surface that loads non‑first‑party HTML/PDF goes inside a sandboxed iframe.

```tsx
<iframe
  src={blobUrl}                                 // blob: URL from a fetched object
  sandbox="allow-scripts allow-same-origin"     // see table — narrowed per content type
  referrerPolicy="no-referrer"
  loading="lazy"
  allow=""                                      // explicit empty Permissions-Policy delegation
/>
```

Sandbox matrix (decisions locked):

| Content | `sandbox` value | Rationale |
|---|---|---|
| **Office (Microsoft Online viewer)** — as built (D-P4.3) | `allow-scripts allow-same-origin allow-popups allow-forms allow-downloads` | We embed `view.officeapps.live.com` (not a local HTML conversion). The viewer **POSTs a form** to load its WOPI render frame (`allow-forms` is mandatory) + offers a download. Cross-origin to the app → `allow-scripts`+`allow-same-origin` grant no escape against us; top-nav stays withheld. `frame-src` includes the viewer; **COEP removed** so the cross-origin frame loads (D-P4.6). |
| **PDF (browser viewer)** — as built (D-P4.7) | none (same-origin `blob:`) | Bytes pulled via the **factory** (`Cloud/Download`, `responseType: blob`) and rendered as a same-origin `blob:` forced to `application/pdf` — sidesteps Edge/SmartScreen, COEP, and `X-Frame-Options` that broke a direct cross-origin iframe, and stays factory-only (no raw `fetch`). No sandbox needed (own bytes, can't be HTML; browser disables PDF JS). Large/failed → open-in-new-tab + download. |
| Markdown / text (CodeMirror) | not iframed | Rendered in‑app; sanitized through the markdown pipeline. |
| Images / video / audio | not iframed | Rendered with native elements; `img-src`/`media-src` already constrains origins. |
| Embedded shares (Phase 4 share links opened in‑app) | `allow-scripts` only | Same as office conversion; never grant `allow-forms` or `allow-top-navigation`. |

Forbidden tokens project‑wide: `allow-top-navigation`, `allow-popups-to-escape-sandbox`, `allow-modals` (unless a
feature explicitly justifies it in review), `allow-forms` (we never need form submit from previewed content).

## 7. Referrer‑Policy and small headers

```
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: on
```

- `X-Frame-Options` is **not** set — `frame-ancestors 'none'` in CSP covers it and avoids the legacy header's
  ambiguities.
- `X-XSS-Protection` is **not** set — deprecated and harmful in modern browsers.

## 8. CI smoke test

A Playwright spec in CI hits a representative set of routes and asserts the exact header values. Failure fails the
build — security headers are not best‑effort.

```ts
// tests/security/headers.spec.ts (Phase 0 lands skeleton, Phase 7 expands route coverage)
import { test, expect } from '@playwright/test';

const routes = ['/', '/login', '/app', '/app/storage', '/app/preview/sample.pdf'];

const must = {
  'strict-transport-security': /max-age=63072000.*includeSubDomains.*preload/,
  'content-security-policy': /default-src 'self'.*nonce-.*frame-ancestors 'none'/s,
  'permissions-policy': /camera=\(\).*microphone=\(\).*interest-cohort=\(\)/s,
  'cross-origin-opener-policy': /^same-origin$/,
  // No cross-origin-embedder-policy — removed (D-P4.6) so preview iframes embed.
  'referrer-policy': /^strict-origin-when-cross-origin$/,
  'x-content-type-options': /^nosniff$/,
};

for (const route of routes) {
  test(`security headers on ${route}`, async ({ request }) => {
    const res = await request.get(route);
    for (const [name, pattern] of Object.entries(must)) {
      expect(res.headers()[name], name).toMatch(pattern);
    }
    // CSP nonce must be unique per response
    expect(res.headers()['content-security-policy']).toMatch(/'nonce-[A-Za-z0-9+/=]{20,}'/);
  });
}
```

The job runs on every PR and on `main`. CSP report‑uri payloads are also surfaced in observability
([observability](./observability.md)) so we catch regressions from new third‑party scripts.

## 9. Phase ownership

| Phase | Owns |
|---|---|
| [P0 — Foundation](../01-roadmap/phases/phase-0-foundation.md) | Proxy shim (`proxy.ts`) + `lib/security/headers.ts`; baseline CSP (report‑only in dev), HSTS, Permissions‑Policy, COOP/COEP, Referrer‑Policy, `nosniff`. CI smoke test skeleton. |
| [P4 — Preview & share](../01-roadmap/phases/phase-4-preview-share.md) | Preview iframe sandbox matrix; CSP `connect-src`/`img-src`/`media-src` extensions for the CDN; share‑link embed sandbox. |
| [P7 — Public polish](../01-roadmap/phases/phase-7-public-polish.md) | Flip CSP from report‑only to enforce in prod; expand CI route coverage; HSTS preload submission decision; final Permissions‑Policy review against shipped features. |

Other phases must not loosen these without an entry in [DECISIONS](../07-decisions/DECISIONS.md).

## 10. Open items

- HSTS preload list submission — confirm we own every subdomain under `storage.umutk.me` before submitting.
- Whether to ship a `Reporting-Endpoints` header alongside `report-uri` once the reporting API stabilizes across
  target browsers.
- Trusted Types: defer to post‑MVP; revisit when we have a sanitizer story for the document editor.
- Subresource Integrity on third‑party scripts (analytics/error reporter) — currently we ship none from a CDN, but
  if Phase 7 introduces any, gate them on SRI.
- CSP for the document editor when a server‑rendered office preview lands — may need a dedicated `frame-src` host.

## Cross‑refs

- [data-layer](../02-architecture/data-layer.md)
- [upload-pipeline](../02-architecture/upload-pipeline.md)
- [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md)
- [preview](../04-features/preview.md)
- [sharing](../04-features/sharing.md)
- [observability](./observability.md)
- [performance](./performance.md)
- [Phase 0](../01-roadmap/phases/phase-0-foundation.md) · [Phase 4](../01-roadmap/phases/phase-4-preview-share.md) · [Phase 7](../01-roadmap/phases/phase-7-public-polish.md)
- [DECISIONS](../07-decisions/DECISIONS.md)
