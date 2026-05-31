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
| **D‑S5** | **Storage insights = client‑side for the current folder (MVP‑light); global aggregate deferred.** | Totals exist (`StorageUsage`); account‑wide aggregate needs an endpoint. [storage-insights](../04-features/storage-insights.md). |
| **D‑S6** | **Sharing = presigned URL, resolved.** `Cloud/PresignedUrl` is the share mechanism; **no managed share‑link backend planned** (supersedes the earlier "backend‑gated" framing). | Q1 resolved by the project owner — presigned covers sharing. [sharing](../04-features/sharing.md). |
| **D‑S7** | **Keep MVP Personal‑focused:** Teams (Phase 8) + organization features (Phase 9) + Trash + PWA stay post‑MVP. | Scope control so MVP ships fast and solid. |
| **D‑S8** | **No faking server‑backed features.** Where the backend can't back a feature, ship a clearly‑labeled per‑device interim or defer; never a fake that looks synced. | Honesty + correct UX expectations. [backend-gaps](./backend-gaps.md). |

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
