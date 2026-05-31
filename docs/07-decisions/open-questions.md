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

## How to use this file
- When a question is answered, **move it to [DECISIONS.md](./DECISIONS.md)** (as a D‑entry) and link the commit/phase.
- New questions discovered during implementation get added here with the same columns.
- `UNVERIFIED` items must be resolved **before** any feature relies on the unproven behavior.
