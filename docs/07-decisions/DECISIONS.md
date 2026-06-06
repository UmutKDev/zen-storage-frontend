# Decisions Log

> Every locked decision, with rationale + consequences. Open questions live in
> [open-questions.md](./open-questions.md). **D#** = decided. Locked decisions from the planning prompt (§0.5/0.6/0.7)
> are recorded here as decided; round answers are D‑A1..A4.

## Locked product/architecture decisions

| # | Decision | Rationale | Consequence |
|---|---|---|---|
| **D1** | **Premium design** on shadcn/ui + Tailwind v4; **framer‑motion** motion system designed in Phase 0 (variants, duration/easing tokens, `prefers-reduced-motion`). Pull primitives via the **shadcn MCP**, then customize. | Premium feel must be systemic, not per‑component; MCP keeps primitives updatable. | Motion tokens/variants exist before features; components wrap MCP primitives. See [design-system](../03-design-system/DESIGN-SYSTEM.md). |
| **D2** | **Session‑based auth** (session id via cookie / `X-Session-Id`), **no refresh token to the client**. Ignore the v2 scaffold README. | Mirrors the backend; avoids token‑in‑JS risks. | Auth.js wraps a session‑id flow; Instance injects the header. [auth-integration](../02-architecture/auth-integration.md). |
| **D3** | **Personal end‑to‑end first; Teams LAST.** Architect team‑ready (`X-Team-Id`, storage owner, query keys) but no team UI early. | Ship value fast; avoid a Teams refactor later. | Phase 8 is additive. [team-readiness](../02-architecture/team-readiness.md). |
| **D4** | **Trash not in MVP** (not in API yet); design delete UX so trash/restore can slot in. | Backend doesn't support it. | Delete is final in MVP; copy makes that clear; UX leaves room. |
| **D5** | **Multi‑select + bulk** (delete/move/download) + **drag‑and‑drop move** (dnd‑kit). | Core file‑manager UX. | Selection store + bulk bar; dnd move distinct from file‑drop upload. |
| **D6** | **Light/dark theme** (system preference default). | Expected baseline. | Token‑driven theming. [theming](../03-design-system/theming.md). |
| **D7** | **i18n:** two languages planned, **EN‑only at MVP**, no hardcoded copy. | Future‑proof without MVP cost. | Dictionary + `t()` + lint rule. [i18n](../06-cross-cutting/i18n.md). |
| **D8** | **Search scope:** global vs current folder, **user chooses, default current** (`Cloud/Search` Path+Extension — verified). | Common case is current folder; global is opt‑in. | Scope toggle in search; URL param. [storage-search-filter](../04-features/storage-search-filter.md). |
| **D9** | **Notifications:** unobtrusive **toasts** + **inbox** with history (socket + `Notification/History` — verified). | Feedback without interruption + a durable record. | NotificationProvider fan‑out. [realtime-socket](../02-architecture/realtime-socket.md). |
| **D10** | **Pricing "coming soon"** — show plans, no checkout in MVP. | Checkout is out of scope. | Pricing page renders plans/static cards, no purchase. [public](../04-features/public.md). |
| **D11** | **API/data layer:** every call via generated **factories**; every DTO a generated **model**; generated client is build output (**never hand‑edit**); one improved **axios `Instance`** centralizes headers, idempotency, envelope unwrap, typed errors/toasts, `401→re-auth`, timeouts/retry/`AbortSignal`. | One correct boundary; no drift; no hand‑rolled types. | All features depend on the Instance. [data-layer](../02-architecture/data-layer.md). |

## Decided this round

| # | Question | Decision | Rationale |
|---|---|---|---|
| **D‑A1** | How to **Share**? | **`GET /Api/Cloud/PresignedUrl` IS the share mechanism** — a signed, time‑limited link (HMAC via rustfs/CDN) → Web Share / copy. Share affordance in the preview toolbar + item menu. | **Q1 resolved (project owner):** presigned URL does this job; **no separate share‑link backend is planned.** Managed permissions/revoke/public‑ACL are out of scope unless requested. [sharing](../04-features/sharing.md). |
| **D‑A2** | Default **conflict** strategy? | **Prompt** with one reusable dialog; **apply‑to‑all** for bulk. No silent overwrites. (`FAIL/REPLACE/SKIP/KEEP_BOTH`.) | Safety + low friction on batches. [conflict-resolution](../02-architecture/conflict-resolution.md). |
| **D‑A3** | **Long‑job** progress transport? | **Socket‑first + status‑polling fallback** (archive create/extract, duplicate scan). | Correctness under socket drops. [realtime-socket](../02-architecture/realtime-socket.md). |
| **D‑A4** | **Auth** library on Next 16.2? | **Auth.js v5 (NextAuth)** credentials, mirroring the multi‑step flow. Verify compat in Phase 0; thin custom cookie‑session is the fallback. | Standard, but bleeding‑edge stack risk → validated early. [auth-integration](../02-architecture/auth-integration.md). |

## Scope round (2026-05-30) — broaden + sharpen MVP

| # | Decision | Rationale |
|---|---|---|
| **D‑S1** | **MVP #1 priority = a rock‑solid storage core.** Invest in storage‑core robustness over breadth; a feature that destabilizes upload/list isn't worth it. | The whole app builds on it. [MVP-DEFINITION](../00-overview/MVP-DEFINITION.md). |
| **D‑S2** | **Add (frontend‑only, MVP): command palette + keyboard shortcuts, observability (errors + analytics), feature flags, onboarding.** | High value, **no backend dependency** → safe to include. Specs in [04-features](../04-features/FEATURE-MAP.md) + [06-cross-cutting](../06-cross-cutting/keyboard-shortcuts.md). |
| **D‑S3 (revised 2026-06-01)** | **Favorites / Recents are BACKEND‑FIRST and OUT of MVP scope.** No client‑side interim, no `localStorage` stub, no per‑device "fake sync" placeholder. The feature ships when the backend ships the endpoints — not before. | Tracked in [backend-gaps.md](./backend-gaps.md). Re‑evaluated when backend ships `Favorites/*` and `Recents/*` (or equivalent). Supersedes the earlier "client‑side per‑device interim" framing under D‑S8's no‑faking rule. [quick-access](../04-features/quick-access.md). |
| **D‑S4** | **Tags/labels = deferred (Phase 9).** | **No backend support**; tags must be durable/shared, so no interim. |
| **D‑S5** | **Storage insights = post‑MVP, backend‑driven** (revised: no client‑side MVP version). MVP ships only the usage bar from `StorageUsage` totals. | Account‑wide aggregate needs an endpoint (Q13); per the no‑faking rule we don't ship a partial client compute as "insights". [storage-insights](../04-features/storage-insights.md). |
| **D‑S6** | **Sharing = presigned URL, resolved.** `Cloud/PresignedUrl` is the share mechanism; **no managed share‑link backend planned** (supersedes the earlier "backend‑gated" framing). | Q1 resolved by the project owner — presigned covers sharing. [sharing](../04-features/sharing.md). |
| **D‑S7** | **Keep MVP Personal‑focused:** Teams (Phase 8) + organization features (Phase 9) + Trash + PWA stay post‑MVP. | Scope control so MVP ships fast and solid. |
| **D‑S8** | **No faking server‑backed features.** Where the backend can't back a feature, ship a clearly‑labeled per‑device interim or defer; never a fake that looks synced. | Honesty + correct UX expectations. [backend-gaps](./backend-gaps.md). |
| **D‑S9** | **Color = monochrome base + one warm accent.** Structure is black/white/grays; **color is reserved for actions/states** (delete → red, etc.); a **single Claude‑style orange** (`#d97757`) accent used sparingly for primary action/focus. | Calm, premium, glass‑friendly; color carries meaning, not decoration. [color](../03-design-system/foundations/color.md). |
| **D‑S10** | **Office preview = client best‑effort + download fallback** (docx/xlsx render, pptx limited); server→PDF conversion is a *later* option. **Theme default = system.** **App name = placeholder ("Storage")** for now. | Q4/theme/app‑name answers from the scope round. |

## Resolved notes (verified facts worth pinning)
- **Instance location:** `service/Instance.ts` (the path `service/factories.ts` already imports) — not `lib/api/`. Error
  mapping/query‑key helpers live in `lib/api`. (Was an open question; resolved by the existing import.)
- **Global prefix `/Api`** + **URI versioning** (`src/main.ts`): session app `/Api/Cloud/*`, API‑key `/Api/v1/*`,
  notifications REST `/Api/v1/Notification/*`.
- **Envelope** `{ Result, Status }`; arrays carry `Options.Count`.
- **Storage owner** `user.Id` vs `team/{TeamId}` (`cloud.context.ts`).
- **Secure‑folder tokens** minted by `Unlock`/`Reveal` (`SessionToken/ExpiresAt/TTL`), replayed via
  `X-Folder-Session`/`X-Hidden-Session`, ancestor‑applicable.
- **Document lock** TTL 5 min (+heartbeat); **draft** throttle 1/10s + S3 backup every 5th.
- **Quota** socket warnings at 80/90/100% (`cloud.usage.service.ts`); upload pre‑flight blocks on max‑size/quota.
- **11 factories** wired today; add Subscription/Notification in Phase 0 if the spec exposes them.
- **CDN (Q5 resolved):** every object is served from **`cdn.storage.umutk.me`**; storage backend is **rustfs** so URLs
  are **HMAC‑signed** (use as‑is); a **wsrv.nl** reverse proxy provides **`?w`/`?h` image resizing**. Image scaling is
  real — `imageCdn.ts` appends the resize query to the opaque signed URL.
- **Avatar (Q7):** `Account/Upload/Image` **exists but is inactive** → avatar upload is **post‑MVP**; ship read‑only
  avatar now. Tracked in [backend-gaps](./backend-gaps.md).
- **Sharing (Q1 resolved):** `Cloud/PresignedUrl` is the share mechanism; no separate share backend planned.

## Folder structure plan (locked 2026-05-31)

- **D‑F1** — **Approach A (strict feature‑sliced + hard barrels) wins** over B (pragmatic layered) and C (domain packages). Highest aggregate across dx/scale/docFit/enforcement lenses; lowest foundational risk per the adversarial critic. See [ARCHITECTURE](../02-architecture/ARCHITECTURE.md#folder-structure).
- **D‑F2** — **Instance lives at `service/Instance.ts`** (reconfirms the "Resolved notes" entry above). Factory import path wins; never relocate under `lib/api/`.
- **D‑F3** — **Interceptors split** into `service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts`; `Instance.ts` is a ~30‑line composer. No 200‑line monolith. See [data-layer](../02-architecture/data-layer.md).
- **D‑F4** — **Inverted‑deps seam** for the secure‑folder token: `service/token-sources.ts` exposes `registerSecureFolderTokenSource(getter)`, called once from `app/providers.tsx`. **`service/` NEVER imports `@/features/`.** See [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md).
- **D‑F5** — **`features/shell/` replaces `components/layout/`.** The shell IS a feature — it owns the workspace‑switcher slot, command‑bar slot, and breadcrumb slot. No top‑level `components/layout/` directory.
- **D‑F6** — **Feature‑LOCAL stores** (`uploads`, `selection`, `viewPrefs`, `secureFolders`) live inside their owning feature, **not** in global `stores/`. Global `stores/` at MVP contains only `workspace.store.ts` + `ui.store.ts`.
- **D‑F7** — **Hard barrels:** a feature or sub‑feature is only enterable through its `index.(ts|tsx)`. Enforced by ESLint `boundaries/entry-point`.
- **D‑F8** — **No `export *` anywhere**[^d-f18] — explicit named re‑exports only. Enforced by `no-restricted-syntax` (AST rule on `ExportAllDeclaration`).

[^d-f18]: Lone exception: `service/models.ts` — see **D-F18** below.
- **D‑F9** — **ESLint at P0 = FULL ENFORCE (error level, not warn).** The architecture is policed by lint from day one; no soft ramp‑up.
- **D‑F10** — **THE ONE sanctioned non‑factory call:** `features/storage/upload/api/presigned-put.ts`. Allowlisted in `eslint.config.mjs` with a top‑of‑file comment pointing back here. No other `fetch`/`axios` may exist.
- **D‑F11** — **Idempotency‑key single source:** `lib/api/idempotency.ts` (UUID v7, `newIdempotencyKey()`). **AbortSignal helpers:** `lib/api/abort.ts` (`composeSignals`, `withTimeout`). Interceptors and feature mutations import from here only.
- **D‑F12** — **ADR convention:** `docs/07-decisions/<NNN>-<slug>.md` (3‑digit zero‑padded, kebab‑case). Code cross‑references via `// see docs/07-decisions/...`.
- **D‑F13** — **Favicon lives in `public/favicon.ico`,** NOT `app/favicon.ico`. Keeps `app/` thin per Next 16 conventions.
- **D‑F14** — **Default Server Components everywhere.** `'use client'` lands at the feature component boundary (the `*Client` suffix), **never on the page**. Pages and layouts stay server‑rendered; `screens/*Screen.tsx` is a server container that mounts a `<*Client>` child.
- **D‑F15** — **Next‑16 root files (`proxy.ts`, `instrumentation.ts`) are ≤5‑line shims;** real logic lives in `lib/auth/` and `lib/observability/`.
- **D-F16: Next 16.2 rename — `middleware.ts` is now `proxy.ts`.** The exported function is `proxy`, not `middleware`. Edge runtime is NOT supported in proxy; it runs Node-only (which is what Auth.js v5 needs anyway). Original `middleware.ts` decision is superseded.
- **D-F18: `service/models.ts` is the SOLE allowlisted `export *` pragma** (besides generator output itself). It re-exports the entire `service/generates/` surface so feature code never imports from `service/generates/*` directly. ESLint enforces this via `no-restricted-imports` (blocks `@/service/generates/*` from features) + a per-file `no-restricted-syntax` override on `service/models.ts`. Rationale: 200+ generated DTOs make named re-exports impractical; tree-shaking handles bundle size at call-site. Migration path: promote to explicit named re-exports if a stable public type contract emerges (e.g., third-party integration).
- **D-F17: PWA / offline / service worker are OUT of MVP scope.** No `app/manifest.ts`, no service-worker registration, no install prompt, no offline cache layer. Touch drag-and-drop has an explicit non-DnD alternative (long-press → bottom sheet with Move / Copy / Delete / Share). The supported browser matrix is pinned in [SUPPORTED-BROWSERS.md](../06-cross-cutting/SUPPORTED-BROWSERS.md). Revisit at Phase 9+ if mobile install / engagement metrics justify the maintenance cost; until then, the app is a fast modern web app, not a PWA.

## Auth strategy (2026-06-01)

- **D-A4 (revised 2026-06-01): Auth.js v5 is the PRIMARY path; custom cookie-session is the FALLBACK.** Both targets are pre-designed so a swap is a single-day operation, not a redesign.
  - **Spike:** Phase 0 task **0.0** runs a **2-day time-boxed** compatibility spike against Next 16.2 (App Router, Server Actions, `proxy.ts` Node-only runtime, session-id credentials flow mirroring the backend).
  - **Pass criteria:** credentials provider drives the multi-step flow, session cookie + `X-Session-Id` reach the `Instance`, no edge-runtime regressions, no patch-package hacks. → **LOCK Auth.js v5.**
  - **Fail criteria:** any of the above blocked, unresolved upstream issue, or hack that violates [CONVENTIONS](../00-overview/CONVENTIONS.md). → **LOCK the custom cookie-session adapter** per the fallback section of [auth-integration.md](../02-architecture/auth-integration.md).
  - **Status:** **pending spike (P0 task 0.0).** Until the spike closes, no auth-dependent feature lands; both paths share the same `lib/auth/` surface so feature code is path-agnostic.

## Cross-cutting locks (2026-06-01)

| # | Decision | Implementation | Spec |
|---|---|---|---|
| **D-X1** | **Strict CSP + nonce baseline.** No `unsafe-inline`, no `unsafe-eval`; per-request nonce on every script/style tag; `frame-ancestors 'none'`; `object-src 'none'`; HSTS + Referrer-Policy + Permissions-Policy locked from day one. | Baseline headers land in **P0 task 0.0a**; preview-surface hardening (sandboxed iframe for Office/PDF rendering, MIME sniffing guards, signed-URL leak audit) lands in **P4**. | [security-headers.md](../06-cross-cutting/security-headers.md) |
| **D-X2** | **KVKK + GDPR full MVP package** — not a post-MVP cleanup. | **From P0:** cookie consent banner (granular: necessary / analytics / marketing), `/privacy`, `/terms`, `/cookies` pages wired via i18n, PII scrubber in the error/observability pipeline (emails, tokens, paths, IPs masked before Sentry). **By P7:** Data Export (zip of user data via backend job) and Delete Account UI (confirm + cooldown + audit log). | [privacy-compliance.md](../06-cross-cutting/privacy-compliance.md) |
| **D-X3** | **Modern-browser matrix + perf budgets enforced in CI.** Chrome, Safari, Firefox, Edge — **last 2 stable versions only**; iOS Safari **17+**; no IE, no legacy Edge, no Samsung Internet polyfill targeting. PWA out of scope (see D-F17). | `size-limit` budgets per route bundle + **Lighthouse CI** gating on every PR (perf / a11y / best-practices / SEO thresholds fail the build). Browserslist pinned in `package.json`; SWC targets match. | [SUPPORTED-BROWSERS.md](../06-cross-cutting/SUPPORTED-BROWSERS.md) + [performance.md](../06-cross-cutting/performance.md) |
| **D-X4** | **Dependency supply-chain disciplined.** No "add a dep and forget" — every transitive surface is policed. | **Renovate** runs weekly (grouped minors auto-merge on green CI, majors gated to a human). **`bun audit --severity high`** is a CI gate (fail on high/critical). **License allowlist** (MIT/Apache-2/BSD/ISC; copyleft requires ADR). **SBOM** (CycloneDX) generated per build and attached to the release artifact. | [dependency-policy.md](../06-cross-cutting/dependency-policy.md) |

## Auth strategy spike outcome (2026-06-06)

- **Auth.js v5 CONFIRMED (D-A4 primary path locked).** `next-auth@5.0.0-beta.31` installs and **`bun run build` passes clean** on Next 16.2.6 (Turbopack) + React 19.2.4. The `proxy.ts` shim (Node runtime) is recognized as `ƒ Proxy (Middleware)`; no edge-runtime regressions, no patch hacks. The custom cookie-session fallback is NOT needed. Full credential/2FA/passkey wiring lands in Phase 1; the `lib/auth/` surface is in place so feature code stays path-agnostic.

## Phase 0 implementation notes & deviations (2026-06-06)

These adjust the original P0 plan where the **as-built stack** required it. Each was needed for a green `tsc` + `lint` + `build`.

- **D-P0.1 — `eslint-plugin-boundaries` pinned to `^5`.** The drop-in config in [folder-structure.md](../02-architecture/folder-structure.md) is v5-shaped; the installed v6 renamed `element-types`→`dependencies` and changed `entry-point` semantics. Pinned v5.4.0 to match the documented config. (Migrate to v6 `dependencies` rule in a later hardening pass.)
- **D-P0.2 — `boundaries/entry-point` uses `default: "allow"`** (not `disallow`). Under v5, `default: disallow` with rules only for feature/subfeature blocks **every** non-feature import (lib, components, service). The intent (§7 rule 2) is that ONLY features/subfeatures are barrel-locked; all other element types allow any entry file by path. Deep feature imports stay blocked via the explicit feature/subfeature rule **and** `no-restricted-imports`.
- **D-P0.3 — `service/` may import `lib/`, and `axios` is allow-listed in `service/**`.** [data-layer.md §2.7](../02-architecture/data-layer.md) has the `Instance` composer + interceptors consume `lib/api` (`newIdempotencyKey`, `unwrapEnvelope`, `toastApiError`, `ApiError`) and `lib/i18n` (`t`). `service/` remains a leaf w.r.t. **features** (still disallowed). `service/Instance.ts` is the ONE sanctioned `axios` user; the feature-side `axios`/`fetch` ban is unchanged everywhere else.
- **D-P0.4 — `Instance.baseURL` is the origin, NOT `origin + /Api`.** The generated client paths already embed `/Api` (e.g. `"/Api/Account/Profile"`). Appending `/Api` produced `/Api/Api/...`. `Instance` now uses `NEXT_PUBLIC_API_URL` with a defensive trailing-`/Api` strip. Supersedes data-layer §2.1's "`+ '/Api'`".
- **D-P0.5 — Root `proxy.ts` defines `config.matcher` as a static literal** (re-exporting `config` from `lib/auth/proxy` fails Next 16.2's static analysis). Only the `proxy` **function** is re-exported; the matcher lives inline in the root shim.
- **D-P0.6 — shadcn ⇄ design-token reconciliation.** Our [color.md](../03-design-system/foundations/color.md) names the brand orange `accent`, but shadcn reserves `--accent` for a neutral hover surface. Resolution: the **brand** is realized as shadcn **`--primary`** (deepened to `#c2410c` light / `#e0937a` dark for AA on filled controls); the neutral hover stays `--accent`/`muted`; our extra state tokens (`success`/`warning`/`danger`/`info`) + glass tokens are added in `@theme inline`. Dark mode is **class-based** (`@custom-variant dark (&:is(.dark *))` + next-themes). Glass (`glass-overlay`, e3 elevation + highlight rim, reduced-transparency fallback) is applied to Dialog/Dropdown/Command overlays; primitives pulled via the shadcn MCP then wrapped.
- **D-P0.7 — Deferred P0 blocks.** Originally (2026-06-06 pass 1) all four were deferred. **Pass 2 (2026-06-06) closed 0.0a security headers + CSP nonce and 0.4a privacy/PII** (see D-P0.8). **Still deferred:** 0.14a supply-chain CI (Renovate/Lighthouse/SBOM/license-checker — pure ops, lands anytime) and 0.8a intercepting-routes spike (a Phase 4 concern). These two must close before the formal P0 acceptance checklist is fully ticked.
- **D-P0.8 — Security headers + privacy foundation (pass 2, 2026-06-06).**
  - **Headers in the proxy, not `next.config`** (security-headers §1): `lib/security/headers.ts` (`STATIC_HEADERS` + `buildCsp(nonce)` + `generateNonce`) and `lib/security/nonce.ts` (`getNonce`, RSC) compose into `lib/auth/proxy.ts`, so the per-request CSP nonce can be threaded.
  - **CSP is Report-Only at P0** (`Content-Security-Policy-Report-Only`), NOT enforcing. Reason: nonce-based enforcing CSP forces *every* page to dynamic rendering (Next CSP guide) and would break the static `not-found` page — a "tasarım bozuk" failure. security-headers §2/§9 also prescribes report-only first. **P7 flips to enforcing** `Content-Security-Policy` (set the CSP on the request header so Next nonces its scripts, force-dynamic where needed) and tightens `style-src`.
  - **`script-src` strict** (`'self' 'nonce-{N}' 'strict-dynamic'`, `+ 'unsafe-eval'` dev only). **`style-src 'self' 'unsafe-inline'`** (no nonce): framer-motion + Radix emit inline `style=""` attributes that nonces can't cover; nonce + unsafe-inline can't coexist. Tighten in P7.
  - **HSTS + CSP are production-gated** (`NODE_ENV === "production"`), so `next dev` HMR isn't affected; static headers (COOP/COEP/CORP, Permissions-Policy, Referrer-Policy, nosniff, DNS-prefetch) apply in both. `report-uri` omitted at P0 (no endpoint yet). Verified via curl + a Playwright `request`-fixture header spec (`tests/security/headers.spec.ts`).
  - **PII scrubber** at `lib/observability/scrubber.ts` (phase-0 0.4a location, not the privacy-doc `service/interceptors/` alt); `reporter.ts` scrubs every payload. **Consent store** at `features/account/stores/consent.store.ts` (zustand `persist` — allowed; only secure-folders bans it) + `features/account/index.ts` barrel. **`legal.*` i18n** namespace added. **ESLint** now bans direct `localStorage.setItem` (privacy §9 PII-surface review gate).
