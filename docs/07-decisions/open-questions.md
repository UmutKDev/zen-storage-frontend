# Open Questions

> Unresolved questions, each with **why it matters**, a **default/proposal**, the **owner**, and the **phase to
> resolve**. Decided items live in [DECISIONS.md](./DECISIONS.md). `UNVERIFIED` = not provable from code today.

| # | Question | Why it matters | Default / proposal | Owner | Resolve by | Status |
|---|---|---|---|---|---|---|
| ~~**Q1**~~ | ~~Real sharing backend planned?~~ | — | — | — | — | ✅ **RESOLVED** → **`/Api/Cloud/PresignedUrl` is the share mechanism** (signed, time‑limited link via rustfs/CDN). No managed share‑link backend planned. See [sharing](../04-features/sharing.md), DECISIONS D‑A1. |
| **Q2** | **Webhook HMAC verification** — when the API delivers a webhook, is its signature verified with an HMAC secret (proving it came from our backend)? | Only the **developer API / webhooks** surface (post‑MVP); irrelevant to the user MVP. | Defer; clarify when building the webhooks surface. Surface in Account ▸ API Keys later. | API team | post‑MVP | **Deferred** — `HmacRequired`/tier hints found, no enforcement in controllers. |
| **Q3** | **Large‑folder** strategy: virtualization + infinite scroll? | Performance on big folders. | **Yes** — `@tanstack/react-virtual` + infinite query (envelope `Skip/Take/Count`). | FE | Phase 3 | Proposed; confirm in Phase 3. |
| ~~**Q4**~~ | ~~Preview coverage — audio? office?~~ | — | — | — | — | ✅ **RESOLVED** → **IN MVP:** image, video, PDF, text/code, **audio**, **office (docx/xlsx/pptx)**. Office is best‑effort client render + download fallback ([preview](../04-features/preview.md)). |
| ~~**Q5**~~ | ~~CDN honor `?w=&h=`?~~ | — | — | — | — | ✅ **RESOLVED** → **Yes.** CDN `cdn.storage.umutk.me` reverse‑proxies images via **wsrv.nl** (supports `?w`/`?h`); object URLs are **HMAC‑signed** (rustfs) — treat as opaque + append resize query. |
| **Q6** | **Pricing page data source** | What the Pricing page renders. | **Decided:** a **dedicated pricing‑page endpoint** (purpose‑built for this page, not the generic plan‑list) will feed the cards. **Doesn't exist yet** → build on backend; render **static cards** until it ships. Page stays "coming soon" (no checkout). | API team (owner) | when built | **Direction decided; endpoint pending** ([backend-gaps](./backend-gaps.md)). |
| **Q7** | **Avatar upload** (`Account/Upload/Image`) | Profile picture editing. | **Endpoint exists but is INACTIVE** → **defer to post‑MVP**; ship read‑only avatar, activate upload when backend completes it (then confirm response shape + re‑fetch profile). | API team | post‑MVP | **Inactive** — see [backend-gaps](./backend-gaps.md#exists-but-inactive--incomplete-endpoint-present-not-usable-yet). |
| **Q8** | **`Options.Count` surfacing** to list hooks (meta channel vs list wrapper)? | Clean pagination/virtualization ergonomics. | Decide a single mechanism in the Instance. | FE | Phase 3 | Open (impl detail). |
| **Q9** | **Preview routing**: intercepting route vs query‑param modal under Next 16.2? | Deep‑linking + arrow‑nav implementation. | Pick after reading bundled Next docs; both satisfy requirements. | FE | Phase 4 | Open. |
| **Q10** | **Favorites/starred API** (build it) | Synced favorites. | **Decided: will build, backend‑first; post‑MVP, no interim.** Needs star/unstar + list endpoints. | API team (owner) | Phase 9 | **Planned** — not built yet ([backend-gaps](./backend-gaps.md)). |
| **Q11** | **Recents endpoint** (expose audit log) | Server‑backed "recently opened". | **Decided: will build, backend‑first; post‑MVP, no interim.** `audit-log.schema.ts` exists; expose a user‑facing view. | API team (owner) | Phase 9 | **Planned** — not built yet. |
| **Q12** | **Tags/labels API** (entity + CRUD + filter) | Organize beyond folders. | **Decided: will build, backend‑first; post‑MVP.** | API team (owner) | Phase 9 | **Planned** — not built yet. |
| **Q13** | **Account‑wide insights/aggregate endpoint** | Storage breakdown / largest files. | **Decided: will build, backend‑driven; post‑MVP.** MVP shows only the usage bar (totals). | API team (owner) | Phase 9 | **Planned** — not built yet. |

## From folder-structure plan (to resolve before P0 lock-in)

> Yes/no decisions surfaced by the locked folder-structure plan. Recommended defaults inline; flip to **DECIDED** in
> [DECISIONS.md](./DECISIONS.md) once chosen. Resolve **before** P0 ESLint lock-in (boundaries + entry-point full
> error). See also: [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md), [data-layer](../02-architecture/data-layer.md).

| # | Question | Default / proposal | Resolve by |
|---|---|---|---|
| **Q14** | Does Auth.js v5 (credentials) need `proxy.ts` matcher rules to protect `(app)/**`, or do we rely on per-segment `lib/auth/guards.ts` redirects? _(Next 16.2: file is proxy.ts, function is proxy(); Edge runtime not supported.)_ | **Per-segment guards** — `proxy.ts` stays a ~5-line shim to `lib/auth/proxy`; segment‑level `lib/auth/guards.ts` redirects keep the auth boundary inside the React tree (session is server‑read via `lib/auth/server.ts`). Add a matcher only if a measured perf/UX gap appears. | P0 / P1 |
| **Q15** | Should `prefetch<Resource>` helpers live in `features/<f>/api/<f>.queries.ts` (current) or in `features/<f>/api/<f>.server.ts` with `import 'server-only'` (safer; doubles file count)? | **Co-locate in `<f>.queries.ts`** — single source per resource; server‑only callers gate via `import 'server-only'` at the call site (screen/page). Re‑evaluate if a client component accidentally pulls server‑only code. | P0 |
| **Q16** | Tailwind v4 token registration: all in `app/globals.css` `@theme` (single source) or split with `lib/motion/tokens.ts` re-export? | **Single source in `app/globals.css` `@theme`** — matches the plan's "SINGLE token source" rule. `lib/motion/tokens.ts` exposes **motion durations/easings only** (JS-consumed), never colors. | P0 |
| **Q17** | Intercepting route `@modal/(.)preview/[key]` + `[[...path]]` catch-all — does it play correctly in Next 16.2? Needs a quick P0 spike. | **Spike in P0**, decide in P4. Fallback: query-param modal under `app/(app)/storage/[[...path]]/` (see Q9). | P0 spike → P4 |
| **Q18** | MSW v2 with Next-16 instrumentation: does `tests/msw/server.ts` need to mount via `instrumentation.ts` for SSR tests, or is `tests/setup.ts` (Vitest) sufficient? | **Start with `tests/setup.ts` only** (Vitest jsdom env). Add an `instrumentation.ts` mount path only when an SSR test actually needs intercept — keep the prod `instrumentation.ts` shim untouched. | P0 |
| **Q19** | Do we need a `features/<f>/api/<f>.ws.ts` convention (per-feature socket listeners) in addition to `features/notifications/lib/handlers/`? | **No, not at MVP.** `features/notifications/` stays the hub; cross‑feature invalidations go through `lib/api/invalidators.ts`. Promote to a per‑feature `.ws.ts` only if a second feature owns a non‑notification socket channel. | P6 |
| **Q20** | Hex literal regex `/^#[0-9a-fA-F]{3,8}$/` — validate it doesn't false-positive on legitimate string IDs starting with `#` before P0 lock-in. | **Audit in P0** before flipping to error. If false positives surface (e.g. anchor fragments, test fixtures), tighten to a token‑boundary form or scope the rule to `.tsx`/`.ts` excluding `tests/fixtures/**`. | P0 |

### Previously-resolved (folder-structure plan)

- ✅ **Instance location**: `lib/api/Instance.ts` vs `service/Instance.ts` → **`service/Instance.ts`** (factory import wins; `service/` is the leaf). See [DECISIONS.md](./DECISIONS.md).
- ✅ **Interceptor layout**: monolith vs split → **split** under `service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts`.
- ✅ **Secure-folder token seam**: `service/token-sources.ts` getter, registered from `app/providers.tsx` — `service/` never imports `@/features/`.
- ✅ **Shell ownership**: `components/layout/` → **`features/shell/`** (shell is a feature; owns `WorkspaceSwitcher` slot).
- ✅ **Feature-local stores**: `uploads`, `selection`, `viewPrefs`, `secureFolders` live under their feature, **not** in global `stores/`. Globals at MVP are `stores/{workspace,ui}.store.ts` only.

## How to use this file
- When a question is answered, **move it to [DECISIONS.md](./DECISIONS.md)** (as a D‑entry) and link the commit/phase.
- New questions discovered during implementation get added here with the same columns.
- `UNVERIFIED` items must be resolved **before** any feature relies on the unproven behavior.
