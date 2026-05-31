# Phase 0 — Foundation + Design System

> **Status:** ⏳ not started · **Depends on:** nothing (this is the base) · **Blocks:** every other phase.
> **Back to:** [ROADMAP](../ROADMAP.md) · **Architecture:** [ARCHITECTURE](../../02-architecture/ARCHITECTURE.md) ·
> **Folder structure:** [folder-structure](../../02-architecture/folder-structure.md) ·
> **Design:** [DESIGN-SYSTEM](../../03-design-system/DESIGN-SYSTEM.md)

## ⚠ Before any code
**Read `node_modules/next/dist/docs/01-app/`.** `AGENTS.md` warns this Next version (16.2) has breaking changes vs.
training data. Do this first, every Phase‑0 session.

## Objective
Stand up a **runnable, team‑ready skeleton** that wires the **locked folder structure** end‑to‑end: shared `Instance` +
split interceptors, `lib/*` seams, global stores, route‑group skeletons, providers, design tokens, motion, i18n, SEO
shims, tests scaffold, and **ESLint boundaries enforced in FULL ERROR mode**. When Phase 0 closes, a developer can scaffold
a feature and it automatically gets auth/team/secure‑folder headers, envelope unwrap, typed errors/toasts, theming,
motion, i18n, and import‑boundary guardrails for free — with **zero feature code shipped**.

## Scope
**In:** the 0.1–0.15 build order below — every directory in the [locked folder plan](../../02-architecture/folder-structure.md)
exists as stubs with explicit barrels; `Instance` composes its 5 interceptors; ESLint enforces the boundary matrix;
tests + MSW + Playwright scaffolds boot; `bunx tsc --noEmit` and `bun run lint` are clean.
**Out:** any feature screen; auth UI (P1); shell UI (P2); storage logic (P3); team‑switch UI (P8); landing page (P7).

## Task breakdown

### 0.0 — Auth.js v5 + Next 16.2 proxy spike (time‑boxed: 2 days)

**Goal:** Verify Auth.js v5 (`next-auth@beta`) credentials flow runs end‑to‑end inside `proxy.ts` (Node runtime only — Edge is unsupported in Next 16.2's `proxy`). This is the **first** Phase‑0 task; it gates whether 0.7 / 0.8 / 0.10 wire Auth.js or the cookie‑session fallback.

**Steps:**
1. Cut a scratch branch off `v2` (`spike/auth-js-v5`). Throwaway — do **not** merge.
2. `bun add next-auth@beta @auth/core`.
3. Scaffold `app/api/auth/[...nextauth]/route.ts` + `lib/auth/config.ts` with a credentials provider (email + password → backend `Account/SignIn`).
4. Implement the multi‑step login flow (credentials → optional 2FA challenge → session issuance).
5. In `proxy.ts`, read the session via `auth()` from the v5 helper and enforce `(app)` route protection.
6. Add `lib/auth/server.ts` that exposes a thin `getSession()` for **RSC** consumption (uses `auth()` server‑side).
7. Wire sign‑out + race protection (concurrent sign‑out requests must not leak a stale session cookie).

**Pass criteria checklist:**
- [ ] `bun run build` succeeds with `next-auth@beta` on Next 16.2 / React 19.
- [ ] Multi‑step login (credentials + 2FA) completes and issues a session.
- [ ] `proxy.ts` enforces auth on `(app)/*` routes via `auth()` (no Edge runtime).
- [ ] An RSC reads the session via `lib/auth/server.ts#getSession()` without hydration mismatch.
- [ ] Sign‑out clears the session cookie; no leaked tokens under concurrent sign‑out races.

**Fail fallback (locked as D‑A4 if any pass criterion fails):** Custom cookie‑session adapter:
- `lib/auth/cookie-session.ts` — HMAC‑SHA256‑signed, `HttpOnly` + `Secure` + `SameSite=Strict`, 7‑day TTL.
- `lib/auth/proxy.ts` — replaces the Auth.js guard, validates the signed cookie in `proxy.ts`.
- `lib/auth/server.ts` — `getSession()` for RSC.
- `lib/auth/client.ts` — React Context provider for client components.
- `app/api/auth/[...session]/route.ts` — handlers for `/login`, `/logout`, `/refresh`.

**Output:** Append a 5‑line summary to `docs/07-decisions/DECISIONS.md` under a new heading `## Auth strategy spike outcome (2026-06-01)` recording the outcome (Auth.js v5 confirmed **or** D‑A4 cookie‑session locked) and the exact reason.

**Acceptance:** Spike outcome recorded in DECISIONS.md; either Auth.js v5 is locked for P1, or D‑A4 cookie‑session adapter is locked and P1 consumes it.

### 0.0a — Security headers + CSP nonce wiring

Per [security-headers](../../06-cross-cutting/security-headers.md). Lands **before** any feature ships so every response carries the baseline headers and every inline script flows through a per‑request nonce.

**Steps:**
1. `lib/security/headers.ts` — export `STATIC_HEADERS`:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Cross-Origin-Opener-Policy: same-origin`
2. `lib/security/nonce.ts`:
   - `getNonce()` — `await headers().get("x-nonce")` (RSC‑safe).
   - `generateNonce()` — `crypto.randomBytes(16).toString("base64")` (16‑byte base64).
3. `next.config.ts` — `async headers()` returns `STATIC_HEADERS` for the route pattern `/(.*)`.
4. `proxy.ts` — generate a nonce per request, set the `x-nonce` **request** header (so RSC can read it), and set the `Content-Security-Policy` **response** header that references the nonce.
5. `app/layout.tsx` — any `<script>` block uses `<script nonce={await getNonce()}>`.
6. `tests/security/headers.smoke.ts` — boots the app, requests `/`, asserts every static header is present and the CSP includes `nonce-<base64>`.

**Acceptance:**
- `curl -I http://localhost:3000/` shows every header from `STATIC_HEADERS`.
- The `Content-Security-Policy` response header contains `nonce-{16-byte-base64}` matching the request's `x-nonce`.
- `bun run test tests/security/headers.smoke.ts` passes.

### 0.1 — Repo hygiene
- [ ] `git mv app/favicon.ico public/favicon.ico` — favicon lives in `public/`, **never** in `app/`.
- [ ] Delete the default `app/page.tsx`. The landing page lands in **Phase 7** (`features/marketing/*` →
      `app/(public)/page.tsx`); root `/` 404s for now (or is handled by the (public) group later).
- **Acceptance:** `app/favicon.ico` absent; `app/page.tsx` absent; `public/favicon.ico` present.
- **Refs:** [folder-structure](../../02-architecture/folder-structure.md).

### 0.2 — Dependencies (bun)
- [ ] Runtime: `bun add axios @tanstack/react-query @tanstack/react-virtual zustand next-auth zod react-hook-form @hookform/resolvers framer-motion socket.io-client sonner cmdk @dnd-kit/core @dnd-kit/sortable @simplewebauthn/browser qrcode.react next-themes server-only`.
- [ ] Dev: `bun add -d eslint-plugin-boundaries eslint-plugin-import vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event msw @playwright/test`.
- [ ] Confirm pre‑existing dev deps: `@openapitools/openapi-generator-cli`, `shadcn@4`, `tailwindcss@4`, `eslint`,
      `eslint-config-next`.
- [ ] Verify `tsconfig` path alias `@/*` resolves to the repo root (single root alias).
- **Acceptance:** `bun install` clean; `package.json` lists every dep above; `bun.lock` updated.

### 0.3 — `service/Instance.ts` + split interceptors + token‑source seam
- [ ] `service/Instance.ts` — **~30 lines**. Builds the axios client (base URL `NEXT_PUBLIC_API_URL + '/Api'`, timeouts)
      and **composes** the 5 interceptors below in order. **No business logic** lives here.
- [ ] `service/interceptors/session.ts` — injects `X-Session-Id` via `getSessionToken()` from `token-sources.ts`
      (isomorphic: server reads from `lib/auth/server`, client from Auth.js session).
- [ ] `service/interceptors/team.ts` — reads `getTeamId()` from `token-sources.ts` (backed by
      `stores/workspace.store.ts`) and sets `X-Team-Id` when non‑null; **wired now**, UI activates in P8.
- [ ] `service/interceptors/secure-folder.ts` — calls `getSecureFolderToken(path)` from `token-sources.ts` and sets
      `X-Folder-Session` / `X-Hidden-Session` (ancestor‑aware). Seam exists now; real getter registers in P5.
- [ ] `service/interceptors/idempotency.ts` — adds `Idempotency-Key` (UUID v7 from `lib/api/idempotency.ts`) on
      Move / Delete / CompleteMultipartUpload.
- [ ] `service/interceptors/envelope.ts` — response side: **unwraps `Result`**, surfaces `Options.Count`, maps
      `Status`/HTTP → typed `ApiError`, fires `lib/api/error-toast`, **`401 → re-auth/sign-out`**, passes `403`/`409`
      through to feature handlers.
- [ ] `service/token-sources.ts` — **inverted‑deps seam**. Exports `registerSessionSource`,
      `registerTeamSource`, `registerSecureFolderTokenSource` + their `get*` consumers. **No‑op getters initially**;
      `app/providers.tsx` registers real sources at runtime. `service/` **never** imports `@/features/*`.
- [ ] `service/models.ts` — curated named re‑exports from `service/generates/*` (consumers go through this; direct
      `@/service/generates/*` import is ESLint‑blocked in 0.12).
- [ ] `service/factories.ts` — `XxxApiFactory(undefined, undefined, Instance)` for every API surface listed in
      [API-INVENTORY](../../05-api/API-INVENTORY.md).
- **Acceptance:** `service/Instance.ts` is ≤ ~30 lines and contains zero conditionals beyond interceptor composition;
      `service/` directory has no `@/features/*` import (grep).
- **Refs:** [data-layer](../../02-architecture/data-layer.md), [secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md),
      [team-readiness](../../02-architecture/team-readiness.md).

### 0.4 — `lib/*` full tree (stubs + barrels)
- [ ] `lib/api/{ApiError,envelope,query-keys,invalidators,error-toast,idempotency,abort,pagination}.ts` — all stubbed
      with explicit types. `query-keys.ts` exports `scopedKey(scope, ...parts)`. `idempotency.ts` exports
      `newIdempotencyKey()` (UUID v7, **single source**). `abort.ts` exports `composeSignals(...signals)` and
      `withTimeout(ms)`.
- [ ] `lib/auth/{config,server,client,guards,proxy}.ts` — `server.ts` + `proxy.ts` start with
      `import 'server-only'`. Stubs only; real wiring lands in P1.
- [ ] `lib/i18n/{config,t,dictionaries/en.json}` — `t(key)` returns the EN value; missing‑key warns in dev.
- [ ] `lib/motion/{tokens,variants,useReducedMotion}.ts` — duration/easing tokens, shared variants (page, modal,
      list‑stagger, hover/press, toast), and the `useReducedMotion` gate.
- [ ] `lib/flags/{registry,useFlag}.ts` — typed registry + `useFlag`/`isEnabled`; defaults in `config/flags.defaults.ts`.
- [ ] `lib/observability/{reporter,events,instrumentation}.ts` — Sentry‑style reporter, event taxonomy, and the
      `instrumentation` register/hook. PII scrub baked in.
- [ ] `lib/socket/{client,types}.ts` — socket.io client factory + handshake types; lifecycle stub (real fan‑out in P6).
- [ ] `lib/validation/primitives.ts` — global zod primitives reused by feature‑local schemas.
- [ ] `lib/shortcuts/{registry,useShortcut}.ts` — central scoped registry; "?" help overlay hook.
- [ ] `lib/seo/{metadata,sitemap,robots,manifest,og}.ts` — the actual SEO logic; `app/*` files just delegate.
- [ ] `lib/utils/{cn,format-bytes,format-date,paths}.ts`.
- [ ] Each `lib/<area>/index.ts` — explicit named re‑exports only (no `export *`).
- **Acceptance:** every path above exists; no `export *` anywhere in `lib/`; `bunx tsc --noEmit` clean.

### 0.4a — Privacy & PII infrastructure stubs

Per [privacy-compliance](../../06-cross-cutting/privacy-compliance.md). Privacy infrastructure lands in P0 so every later feature inherits PII scrubbing, consent gating, and a legal copy namespace by default.

**Steps:**
1. `lib/observability/scrubber.ts` — exports `scrub(payload)` and `scrubBreadcrumb(breadcrumb)`. Redacts every PII category before anything reaches the reporter:
   - `email` (regex match anywhere in strings)
   - `Path` and `Filename` (PascalCase API fields)
   - tokens (`X-Session-Id`, `X-Folder-Session`, `X-Hidden-Session`, `Authorization`, `Cookie`, anything matching `*Token`/`*Key`)
   - request/response **headers** that carry auth
   - **S3 query strings** (presigned URLs — strip everything after `?`)
2. `features/account/stores/consent.store.ts` — feature‑local Zustand store (NOT in `stores/`):
   - Shape: `{ essential: true, functional: false, analytics: false }`.
   - Action: `setConsent(category, value)` (`essential` is read‑only `true`).
   - Persists to `localStorage` under a stable key and hydrates on mount.
3. `lib/i18n/dictionaries/en.json` — add the `legal.*` namespace with placeholder copy (privacy policy heading, ToS heading, cookie banner copy, consent toggle labels). Real copy lands with the legal pages.

**Acceptance:**
- Scrubber unit tests cover every PII category above (email, Path, Filename, tokens, headers, S3 query strings) and assert the redaction.
- `consent.store` hydrates from `localStorage` and survives a refresh in a smoke test.
- `legal.*` namespace is present in `en.json` and `t('legal.privacy.heading')` returns the placeholder string.

### 0.5 — Global Zustand stores
- [ ] `stores/workspace.store.ts` — `{ ownerId, teamId, switchTo(...) }`. Drives `X-Team-Id` and **every** query‑key
      scope. Created **now** even though UI lands in P8.
- [ ] `stores/ui.store.ts` — modal stack, theme bits, command‑palette open state.
- [ ] `stores/index.ts` — named re‑exports only.
- [ ] **No other global stores at MVP.** `uploads`, `selection`, `viewPrefs`, `secureFolders` are **feature‑local**
      (see [state-management](../../02-architecture/state-management.md)).
- **Acceptance:** `stores/` contains exactly `workspace.store.ts`, `ui.store.ts`, `index.ts`. The legacy
      `stores/secureFolders/` path does NOT exist — secure‑folder state lives at
      `features/secure-folders/stores/secureFolders.store.ts` (built in P5).

### 0.6 — `config/*`
- [ ] `config/env.ts` — zod schema validating every `NEXT_PUBLIC_*` env var; throws at boot if invalid.
- [ ] `config/constants.ts` — non‑secret, build‑time constants.
- [ ] `config/flags.defaults.ts` — default values consumed by `lib/flags/registry`.
- **Acceptance:** missing/invalid env fails `bun run dev` with a typed error pointing at the bad key.

### 0.7 — `types/*`
- [ ] `types/env.d.ts` — augments `ProcessEnv` from the zod schema.
- [ ] `types/next-auth.d.ts` — Session/JWT shape stubs (real shape in P1).
- [ ] `types/global.d.ts` — ambient declarations only.
- **Acceptance:** `bunx tsc --noEmit` resolves all augmentations.

### 0.8 — Route groups + `app/providers.tsx`
- [ ] `app/(public)/layout.tsx`, `app/(auth)/layout.tsx`, `app/(app)/layout.tsx` — **Server Components**, empty shells
      (real content arrives in P1/P2/P7). Per‑segment `loading.tsx`/`error.tsx` boundaries where useful.
- [ ] `app/(app)/storage/[[...path]]/page.tsx` — catch‑all skeleton (real screen in P3). See
      [routing-deep-linking](../../02-architecture/routing-deep-linking.md).
- [ ] `app/providers.tsx` — `'use client'`. Mounts `QueryClientProvider`, `SessionProvider`, `ThemeProvider`
      (`next-themes`), `MotionConfig`, `Toaster` (sonner). **Critically:** calls
      `registerSessionSource(...)`, `registerTeamSource(...)`, `registerSecureFolderTokenSource(...)` from
      `@/service/token-sources` at mount so the `Instance`'s interceptors can read tokens without `service/` importing
      features.
- [ ] `app/layout.tsx` — root `<html>`; mounts `<Providers/>`; imports `globals.css`.
- **Acceptance:** `next dev` boots; visiting `/`, `/auth/sign-in`, `/storage`, `/storage/a/b` all render empty‑but‑live
      route group shells.

### 0.8a — Intercepting routes + catch-all spike (Q17)

**Goal:** Verify Next 16.2 supports the combination `@modal/(.)preview/[key]` parallel-intercepting route + `[[...path]]` catch-all in the same `app/(app)/storage/` segment, BEFORE Phase 4 commits to this architecture.

**Steps:**
1. Scaffold a minimal `app/(app)/storage/[[...path]]/page.tsx` returning the path segments.
2. Add `app/(app)/storage/@modal/(.)preview/[key]/page.tsx` that renders a stub modal.
3. Add `app/(app)/storage/layout.tsx` accepting `{ children, modal }` props.
4. Run `bun run dev`; navigate to `/storage/a/b/preview/some-key`.
5. **Pass criteria:** The catch-all renders the underlying page AND the intercepted modal renders on top. Back-navigation reveals `/storage/a/b` without the modal.
6. **Fail fallback:** Drop the intercepting modal in favor of a query-param modal (`?preview=key`) routed through `<PreviewModal />` mounted in the shell. Lock the fallback in DECISIONS.md as **D-F17** if the spike fails.

**Acceptance:** Either confirms intercepting+catch-all combo works (locked into DECISIONS.md as resolved) OR the query-param fallback is locked as D-F17.

**Output:** Append a 3-line summary to `docs/07-decisions/DECISIONS.md` under a new heading `## Next 16.2 spike outcomes (2026-05-31)`.

### 0.9 — `app/globals.css` (single token source)
- [ ] Tailwind v4 `@theme` block — **the only place** semantic tokens are declared (color, surface, border, accent,
      state colors success/warning/danger/info; spacing, radius, shadow, type ramp).
- [ ] Glass utilities (`glass-chrome`, `glass-overlay`) with the `prefers-reduced-transparency` solid fallback baked in.
- [ ] No raw hex anywhere outside this file (and `lib/motion/*`, `components/ui/*` per ESLint exemption).
- **Refs:** [foundations/color](../../03-design-system/foundations/color.md),
      [foundations/glassmorphism](../../03-design-system/foundations/glassmorphism.md),
      [motion/tokens](../../03-design-system/motion/tokens.md).
- **Acceptance:** any token referenced by a component resolves to a CSS variable defined in `globals.css`.

### 0.10 — Root seam files + SEO delegations
- [ ] `proxy.ts` (repo root) — **≤ ~5‑line shim** re‑exporting the `proxy` function from `lib/auth/proxy`
      (Next 16.2 rename — the file is no longer middleware.ts, and Edge runtime is not supported in proxy).
- [ ] `instrumentation.ts` (repo root) — **≤ ~5‑line shim** re‑exporting from `lib/observability/instrumentation`.
- [ ] `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/opengraph-image.tsx` — thin delegations to
      `lib/seo/{sitemap,robots,manifest,og}`.
- [ ] `app/not-found.tsx`, `app/error.tsx` — Server / Client respectively, delegating styling to `components/ui` + tokens.
- **Acceptance:** root seam files each ≤ ~10 lines; logic lives in `lib/`.

### 0.11 — shadcn primitives (via MCP) + `components/*`
- [ ] `shadcn init` → `components.json` (new‑york, neutral).
- [ ] Pull via the **shadcn MCP** (never raw copy): `button`, `dialog`, `dropdown-menu`, `command`, `tooltip`, `input`,
      `sonner`.
- [ ] Wrap each in `components/ui/<name>.tsx` — semantic tokens only, motion variants from `lib/motion`,
      reduced‑motion respected, focus/a11y correct.
- [ ] `components/ui/index.ts` — explicit named re‑exports.
- [ ] `components/patterns/` — directory created with a placeholder `index.ts` (real patterns in P3).
- [ ] `components/icons/` — directory created with an empty `index.ts` (custom SVG only).
- **Acceptance:** every wrapped primitive renders without `#RRGGBB` literals and animates correctly under
      `prefers-reduced-motion: reduce`.
- **Refs:** [DESIGN-SYSTEM](../../03-design-system/DESIGN-SYSTEM.md).

### 0.12 — ESLint boundaries (FULL ERROR at P0)
- [ ] **Replace** `eslint.config.mjs` with the drop‑in config from
      [folder-structure](../../02-architecture/folder-structure.md): `boundaries/element-types` +
      `boundaries/entry-point` + `no-restricted-imports` + `no-restricted-syntax`.
- [ ] Enforce in **error** mode (not warn‑then‑error):
      - one‑way layering app → features → (components, lib, service, stores, hooks, config, types);
      - hard barrels — feature/subfeature reachable **only** through `index.(ts|tsx)`;
      - no deep cross‑feature import (`@/features/<x>/upload/...` blocked);
      - `axios` import + raw `fetch(` blocked (single allowlisted exception:
        `features/storage/upload/api/presigned-put.ts` — lands in P3);
      - `*Dto|*Request|*Response` type names blocked under `features/**/api/**` and `features/**/types.ts`;
      - direct `@/service/generates/*` import blocked (use `@/service/models`);
      - raw hex literal `/^#[0-9a-fA-F]{3,8}$/` blocked outside `app/globals.css`, `lib/motion/**`, `components/ui/**`;
      - `export *` blocked everywhere;
      - `features/secure-folders/stores/secureFolders.store.ts` blocks `persist`, `localStorage`, `sessionStorage`,
        `document.cookie` (rule exists now even though the store lands in P5).
- [ ] `bun run lint` — clean tree.
- **Acceptance:** planted violations (e.g. `import axios from 'axios'`, `import { X } from '@/features/storage/upload/api/...'`,
      a literal `'#fff'` in a component, `export *` in a barrel) each fail lint with the expected message.

### 0.13 — Tests scaffold
- [ ] `tests/setup.ts` — Vitest + jsdom + RTL setup; starts MSW server.
- [ ] `tests/test-utils.tsx` — `renderWithProviders(ui)` mounting QueryClient + Theme + Motion + Toaster.
- [ ] `tests/fixtures/` — directory; future `<resource>.fixtures.ts` files type fixtures via `@/service/models`
      (**no hand‑rolled DTOs** — ESLint enforces this in feature code).
- [ ] `tests/msw/server.ts` + `tests/msw/handlers/.gitkeep`.
- [ ] `tests/e2e/.gitkeep` for Playwright specs.
- [ ] `package.json` scripts: `"test": "vitest"`, `"test:e2e": "playwright test"`.
- **Acceptance:** `bun run test` runs (zero specs, zero failures); `bun run test:e2e --list` resolves the project.
- **Refs:** [testing](../../06-cross-cutting/testing.md).

### 0.14 — Type & boundary sanity
- [ ] `bunx tsc --noEmit` — clean. In particular, the previously‑broken
      `service/factories.ts` → `./Instance` import now resolves.
- [ ] `bun run lint` — clean.
- **Acceptance:** both commands exit 0 on a freshly cloned tree.

### 0.14a — Supply‑chain CI gates

Per [dependency-policy](../../06-cross-cutting/dependency-policy.md). The supply chain is policed by CI from day one — dependency bumps, license drift, vulnerability surface, SBOM artifacts, bundle size, and Lighthouse budgets all gate PRs.

**Steps:**
1. `renovate.json` — group rules:
   - **security** group: severity ≥ high → auto‑open PR immediately.
   - **standard** group: minor/patch runtime deps, weekly.
   - **dev tool** group: dev dependencies, weekly, batched.
2. `.github/workflows/supply-chain.yml` — runs on every PR:
   - `bun install --frozen-lockfile`
   - `bun audit --severity high` (fail on any high/critical advisory)
   - `bunx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC0-1.0;0BSD;Unlicense"` (fail on AGPL, GPL, unknown)
   - `bunx @cyclonedx/cyclonedx-npm --output-file sbom.json` → upload `sbom.json` as a workflow artifact
3. `package.json` — add `size-limit` and `@lhci/cli` as dev deps; add `.size-limit.json` with budgets per [performance](../../06-cross-cutting/performance.md) §2.
4. `.github/workflows/perf-budget.yml` — runs `bunx size-limit` and `bunx lhci autorun` on PR; fails on budget breach.

**Acceptance:**
- A PR that deliberately imports a large module (e.g. `lodash` whole) → `size-limit` step fails.
- A PR that adds an AGPL‑licensed dep → `license-checker` step fails.
- `sbom.json` is uploaded as an artifact on every CI run and is downloadable from the workflow summary.

### 0.15 — Commits & push
- [ ] Split into **logical commits**, each green on lint + types:
      `chore: move favicon to public, drop default landing` ·
      `chore: install runtime + dev deps for v2` ·
      `chore: scaffold service/Instance + interceptors + token-sources` ·
      `chore: scaffold lib/* and global stores` ·
      `chore: scaffold config/* and types/*` ·
      `chore: scaffold route groups + providers + globals.css` ·
      `chore: add root seam files + SEO delegations` ·
      `chore: pull + wrap shadcn primitives` ·
      `chore: enforce import boundaries (FULL ERROR)` ·
      `chore: scaffold tests + MSW + Playwright`.
- [ ] Push the `v2` branch. **Never** push to `main`; **never** `--force`.

## Endpoints used
None called for features. **Smoke‑test only:** one `Account/Profile` GET through the `Instance` to prove the full path
(headers → unwrap → typed data). See [API: account](../../05-api/modules/account.md).

## Acceptance‑test checklist
- [ ] `bun run dev` boots with no runtime errors; `bun run build` succeeds.
- [ ] `bunx tsc --noEmit` clean; `bun run lint` clean (with planted violations failing as expected).
- [ ] Theme toggle works and respects system preference; `prefers-reduced-motion` swaps motion variants to instant.
- [ ] A factory call (`Account/Profile`) returns **unwrapped, typed** data through the `Instance`; a forced error
      produces a typed `ApiError` + a sonner toast; a simulated `401` triggers re‑auth/sign‑out.
- [ ] `bun run generate:service:test` regenerates `service/generates/*` cleanly; the diff is committed.
- [ ] `t('some.key')` renders an EN string; the i18n / hardcoded‑copy lint heuristic flags a planted 3+‑word JSX literal.
- [ ] Route groups resolve; `storage/[[...path]]` renders the skeleton for `/storage` and `/storage/a/b`.
- [ ] `service/` directory contains **zero** imports from `@/features/*` (grep).
- [ ] `bun run test` and `bun run test:e2e --list` exit 0.
- [ ] 0.8a spike result recorded in DECISIONS.md (either intercepting+catch-all confirmed OR D-F17 query-param fallback locked).
- [ ] **0.0** — Auth strategy spike outcome locked in DECISIONS.md (Auth.js v5 confirmed **or** D‑A4 cookie‑session adapter locked).
- [ ] **0.0a** — Security headers smoke test green: every `STATIC_HEADERS` entry present on `/`, CSP carries a per‑request `nonce-{base64}`.
- [ ] **0.4a** — Scrubber unit tests pass for every PII category (email, Path, Filename, tokens, headers, S3 query strings); `consent.store` persists across refresh; `legal.*` i18n namespace resolves.
- [ ] **0.14a** — Supply‑chain CI green: `bun audit`, `license-checker`, `size-limit`, and Lighthouse budgets all pass; `sbom.json` uploaded as a workflow artifact.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| **Auth.js v5 ↔ Next 16.2 / React 19** incompatibility | Time‑boxed spike early; if blocked, thin custom cookie‑session adapter (record in [DECISIONS](../../07-decisions/DECISIONS.md)). |
| **Tailwind v4 + shadcn MCP intake** friction | Validate one primitive end‑to‑end (button) before pulling the rest. |
| **`boundaries/entry-point` false positives** on co‑located test/util files | Keep feature surface minimal at P0; widen `allow` glob only with an ADR. |
| **Raw‑hex regex false positives** on legit string IDs | Track in [open-questions](../../07-decisions/open-questions.md); add per‑file overrides via ADR if needed. |
| **Next 16 breaking changes** | Read bundled docs in `node_modules/next/dist/docs/01-app/` first; heed deprecations. |
| **Spec unreachable** at generate time | Keep committed client; document local API bring‑up. |

## Rollback / fallback
- Auth library: fall back to a **custom cookie‑session adapter** if Auth.js v5 is blocked (P1 consumes whichever ships).
- Motion: ship tokens + the minimal variant set; expand variants later — never block P0 on full motion polish.
- ESLint boundary rules: if a planted rule produces unworkable noise, **narrow the rule via an ADR** —
  do **not** downgrade to `warn`.

## Exit criteria
A team‑ready skeleton that boots, themes, animates (reduced‑motion aware), speaks to the API through one typed
`Instance` with composed interceptors and consistent errors/toasts, registers token sources via the inverted‑deps seam,
resolves the route groups, and **enforces every import boundary in error mode** — with **zero feature code**. On meeting
this, mark Phase 0 ✅ in [STATUS](../STATUS.md), add a Changelog line in [ROADMAP](../ROADMAP.md), and begin
[Phase 1](./phase-1-auth.md).
