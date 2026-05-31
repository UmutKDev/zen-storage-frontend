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
| **D‑S3** | **Favorites/Recents = client‑side, per‑device interim in MVP; synced version post‑MVP.** | **No backend endpoints** ([backend-gaps](./backend-gaps.md)); don't fake sync. [quick-access](../04-features/quick-access.md). |
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
- **D‑F8** — **No `export *` anywhere** — explicit named re‑exports only. Enforced by `no-restricted-syntax` (AST rule on `ExportAllDeclaration`).
- **D‑F9** — **ESLint at P0 = FULL ENFORCE (error level, not warn).** The architecture is policed by lint from day one; no soft ramp‑up.
- **D‑F10** — **THE ONE sanctioned non‑factory call:** `features/storage/upload/api/presigned-put.ts`. Allowlisted in `eslint.config.mjs` with a top‑of‑file comment pointing back here. No other `fetch`/`axios` may exist.
- **D‑F11** — **Idempotency‑key single source:** `lib/api/idempotency.ts` (UUID v7, `newIdempotencyKey()`). **AbortSignal helpers:** `lib/api/abort.ts` (`composeSignals`, `withTimeout`). Interceptors and feature mutations import from here only.
- **D‑F12** — **ADR convention:** `docs/07-decisions/<NNN>-<slug>.md` (3‑digit zero‑padded, kebab‑case). Code cross‑references via `// see docs/07-decisions/...`.
- **D‑F13** — **Favicon lives in `public/favicon.ico`,** NOT `app/favicon.ico`. Keeps `app/` thin per Next 16 conventions.
- **D‑F14** — **Default Server Components everywhere.** `'use client'` lands at the feature component boundary (the `*Client` suffix), **never on the page**. Pages and layouts stay server‑rendered; `screens/*Screen.tsx` is a server container that mounts a `<*Client>` child.
- **D‑F15** — **Next‑16 root files (`middleware.ts`, `instrumentation.ts`) are ≤5‑line shims;** real logic lives in `lib/auth/` and `lib/observability/`.
