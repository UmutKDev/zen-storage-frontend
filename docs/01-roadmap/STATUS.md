# STATUS — progress tracker

> Lightweight, **always‑current** tracker. The source of truth for phase *detail* is each
> [`phases/phase-N-*.md`](./phases/) file; this is the one‑screen "where are we" view.
>
> Legend: ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

**Updated:** 2026-06-06 · **Branch:** `v2` · **Round:** Phase 0 implementation (core skeleton + design system landed).

## Where we are
**Phase 0 core landed.** The runnable, team‑ready skeleton + design system is in place and green on
`build` / `tsc` / `lint` / `test`: the shared `Instance` + split interceptors + token‑source seam, the full `lib/*`
tree, global stores, config/types, route groups + providers, the design‑token system (semantic + shadcn‑bridge tokens,
glass utilities, class‑based dark mode, motion), shadcn primitives wrapped for the premium look, ESLint boundaries in
FULL ERROR mode, and the test scaffold (Vitest/RTL/MSW/Playwright) with passing smoke tests. Auth.js v5 confirmed on
Next 16.2 / React 19. **Deferred to a follow‑up P0 pass** (see DECISIONS D‑P0.7): 0.0a security headers/CSP, 0.4a
privacy/PII, 0.14a supply‑chain CI, 0.8a intercepting‑routes spike.

## Planning round checklist — ✅ complete
- [x] Explored 3 layers (API `nestjs-storage`, old frontend `main`, v2 scaffold) — read‑only
- [x] Verified contract (controllers, envelope, headers, secure‑folder tokens, gateway, **Share absent**)
- [x] Authored core planning docs (roadmap, architecture, feature map, API inventory, decisions)
- [x] Locked 4 decisions (Share, conflict, job transport, auth)
- [x] **Restructured** docs into category hierarchy; expanded every area to maximum detail
- [ ] **Awaiting user approval to begin Phase 0**

## Phase status
| Phase | Title | Status | Notes |
|---|---|---|---|
| 0 | Foundation + Design System | ✅ | All sub-tasks closed: data layer, design system, 0.0a CSP/headers, 0.4a privacy, 0.8a intercepting-routes (confirmed), 0.14a supply-chain CI |
| 1 | Auth | ✅ | Full: multi-step login (+2FA **+passkey**), register, reset, route protection, sign-out teardown, **legal pages + consent banner**. Verified live vs API + 16 tests |
| 2 | App Shell + Account | ⏳ | no team switch |
| 3 | Storage Core | ⏳ | upload pipeline is the heavy lift |
| 4 | Preview + Share | ⏳ | Share = presigned URL ✓; CDN resize via wsrv.nl ✓ (both resolved) |
| 5 | Secure Folders | ⏳ | token never‑persist guarantee |
| 6 | Advanced | ⏳ | socket‑first + poll for jobs |
| 7 | Public & Polish | ⏳ | **MVP completes here** (+ onboarding, observability finish) |
| 8 | Teams (post‑MVP) | ⏳ | architect‑for now, build last |
| 9 | Organization & Discovery (post‑MVP) | ⏳ | **backend‑gated**: favorites/recents/tags/global‑insights/real‑share |

## Current scaffold state (v2)
- **Installed:** `next@16.2.6`, `react@19.2.4`, `react-dom@19.2.4`; dev: `@openapitools/openapi-generator-cli`,
  `shadcn@4`, `tailwindcss@4`, `eslint`, `typescript`.
- **Present:** `openapitools.json` (generator `typescript-axios` 7.17.0 → `service/generates`, `modelPackage:"dto"`,
  `useSingleRequestParameter`, `withInterfaces`), `service/factories.ts` (11 factories wired on `./Instance`),
  `service/generates/` (committed), Tailwind v4 `globals.css` (only `--background`/`--foreground` so far),
  `tsconfig.json` path alias `@/*`.
- **Note:** `service/factories.ts` imports `./Instance` (i.e. `service/Instance.ts`) which **does not exist yet** —
  Phase 0 creates it. Location locked at `service/Instance.ts` (factory import wins; see
  [folder structure](../02-architecture/folder-structure.md) + [decisions](../07-decisions/DECISIONS.md)).
- **Missing (Phase 0 builds):** all feature deps (TanStack Query, Zustand, Auth.js, socket.io‑client, framer‑motion,
  dnd‑kit, rhf+zod, sonner, react‑virtual, CodeMirror, qrcode.react, @simplewebauthn/browser, lucide), the `Instance`,
  shadcn init (`components.json`), motion/i18n/theme libs, providers, route groups.

## What's next
1. Get approval on the plan + the 4 decisions + the open questions (esp. Q1 sharing, Q5 CDN). `Instance` location
   resolved → `service/Instance.ts`.
2. On "implement Phase 0": **read `node_modules/next/dist/docs/01-app/` first**, then execute the
   [Phase 0 checklist](./phases/phase-0-foundation.md) against the locked
   [folder structure](../02-architecture/folder-structure.md).

## Recent status entries
- **2026-06-06 (all deferrals closed)** — Cleared every deferred item. **0.8a** intercepting-routes confirmed live
  (`@modal` + `(.)preview/[key]` + `[[...path]]` coexist; build lists both). **0.14a** supply-chain CI: renovate +
  `supply-chain.yml` (prod audit clean, license allowlist clean — LGPL-3.0 for sharp/libvips + CC-BY-4.0 for
  caniuse-lite ADR'd, private root excluded; SBOM) + `perf-budget.yml` (size-limit 438/480 KB + Lighthouse). **1.2**
  passkey login (Begin/Finish + @simplewebauthn, bypasses 2FA, feature-detect). **1.6** legal pages
  (privacy/terms/cookies/data-processing) + cookie consent banner. Backend error-code→friendly mapping (D-P1.6).
  build/tsc/lint green, 16 vitest. Phase 0 + Phase 1 now ✅. (D-P0.7 closed; D-P0.9-spike, D-P0.10, D-P1.5/1.6.)
- **2026-06-06 (Phase 1 spine)** — **Auth implemented (spine).** Auth.js v5 (split config: edge-safe base + full
  node instance) + `app/api/auth/[...nextauth]` route handler; UI-driven multi-step login (email→password→2FA) +
  register + reset under `features/auth` (rhf+zod, shadcn form/input-otp/alert/card, motion step transitions, 429
  countdown, a11y); `SessionSync` wires the session token-source + sign-out handler; proxy route protection
  (`auth()` wrapper + redirects, composed with security headers); full `signOutAndCleanup` teardown. The P0 dev loop
  is gone (`/api/auth/session` → 200). Verified: build/tsc/lint green, 15 vitest (incl. multi-step login + 2FA handoff
  + teardown-order), browser render of login/register (light+dark) + `/storage`→`/login?from=` redirect. Decisions
  D-P1.0–D-P1.4. Deferred: passkey login (→P2), legal pages + consent banner (follow-up).
- **2026-06-06 (pass 2)** — **Closed P0 security + privacy foundation (0.0a + 0.4a).** Security headers + per-request
  CSP **nonce** emitted from the proxy via `lib/security/*` (Report-Only at P0 — enforcing flips in P7, D-P0.8); HSTS/CSP
  prod-gated. PII **scrubber** (`lib/observability/scrubber.ts`) wired into the reporter; **consent store**
  (`features/account/`, first feature barrel) + `legal.*` i18n; ESLint bans direct `localStorage.setItem`. Verified:
  curl + Playwright header spec (3/3), 12 vitest tests, `build`/`tsc`/`lint` green. Remaining P0: 0.14a CI, 0.8a spike.
- **2026-06-06** — **Phase 0 core implemented.** Deps installed (Next 16.2 / React 19 / next-auth@5 beta / Tailwind v4 /
  framer-motion / shadcn via MCP). Data layer (`Instance` + 5 interceptors + token-sources), full `lib/*`, stores,
  config/types, route groups + providers, design-token `globals.css` (semantic + shadcn bridge + glass + class-dark),
  wrapped shadcn primitives, ESLint boundaries (FULL ERROR, planted violations verified), test scaffold + 3 passing
  smoke tests. `build`/`tsc`/`lint`/`test` all green. Deviations + spike outcome logged in DECISIONS (D-A4 confirmed,
  D-P0.1–D-P0.7). Deferred blocks: 0.0a/0.4a/0.14a/0.8a.
- **2026-05-31** — Folder structure plan locked (Approach A + 4 grafts from B/C). Authoritative spec:
  [`docs/02-architecture/folder-structure.md`](../02-architecture/folder-structure.md). P0 checklist:
  [`docs/01-roadmap/phases/phase-0-foundation.md`](./phases/phase-0-foundation.md). ESLint enforce mode: **full at P0**.

## Blockers / waiting on
- **User approval** of the planning round.
- **API team** on the backend‑gated org features (Q10 favorites, Q11 recents, Q12 tags, Q13 insights) + Q2 (webhook HMAC)
  + activating the avatar endpoint (Q7) — all **non‑blocking for MVP**. (Q1 sharing + Q5 CDN resize are resolved.)
