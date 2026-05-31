# Open Questions

> Unresolved questions, each with **why it matters**, a **default/proposal**, the **owner**, and the **phase to
> resolve**. Decided items live in [DECISIONS.md](./DECISIONS.md). `UNVERIFIED` = not provable from code today.

| # | Question | Why it matters | Default / proposal | Owner | Resolve by | Status |
|---|---|---|---|---|---|---|
| ~~**Q1**~~ | ~~Real sharing backend planned?~~ | — | — | — | — | ✅ **RESOLVED** → **`/Api/Cloud/PresignedUrl` is the share mechanism** (signed, time‑limited link via rustfs/CDN). No managed share‑link backend planned. See [sharing](../04-features/sharing.md), DECISIONS D‑A1. |
| **Q2** | **Webhook HMAC verification** — when the API delivers a webhook, is its signature verified with an HMAC secret (proving it came from our backend)? | Only the **developer API / webhooks** surface (post‑MVP); irrelevant to the user MVP. | Defer; clarify when building the webhooks surface. Surface in Account ▸ API Keys later. | API team | post‑MVP | **Deferred** — `HmacRequired`/tier hints found, no enforcement in controllers. |
| **Q3** | **Large‑folder** strategy: virtualization + infinite scroll? | Performance on big folders. | **Yes** — `@tanstack/react-virtual` + infinite query (envelope `Skip/Take/Count`). | FE | Phase 3 | Proposed; confirm in Phase 3. |
| **Q4** | **Preview coverage** at MVP — audio? office docs? | Scope of Phase 4 preview. | Image / video / text‑code / PDF **in**; audio + office **out**. | FE/product | Phase 4 | Proposed; confirm in Phase 4. |
| ~~**Q5**~~ | ~~CDN honor `?w=&h=`?~~ | — | — | — | — | ✅ **RESOLVED** → **Yes.** CDN `cdn.storage.umutk.me` reverse‑proxies images via **wsrv.nl** (supports `?w`/`?h`); object URLs are **HMAC‑signed** (rustfs) — treat as opaque + append resize query. |
| **Q6** | **Pricing data source** for "coming soon" — public plan‑list endpoint, or admin‑only? | What the Pricing page renders. | `Subscription/My` + static cards if no public list. | API team | Phase 7 | Open. |
| **Q7** | **Avatar upload** (`Account/Upload/Image`) | Profile picture editing. | **Endpoint exists but is INACTIVE** → **defer to post‑MVP**; ship read‑only avatar, activate upload when backend completes it (then confirm response shape + re‑fetch profile). | API team | post‑MVP | **Inactive** — see [backend-gaps](./backend-gaps.md#exists-but-inactive--incomplete-endpoint-present-not-usable-yet). |
| **Q8** | **`Options.Count` surfacing** to list hooks (meta channel vs list wrapper)? | Clean pagination/virtualization ergonomics. | Decide a single mechanism in the Instance. | FE | Phase 3 | Open (impl detail). |
| **Q9** | **Preview routing**: intercepting route vs query‑param modal under Next 16.2? | Deep‑linking + arrow‑nav implementation. | Pick after reading bundled Next docs; both satisfy requirements. | FE | Phase 4 | Open. |
| **Q10** | **Favorites/starred API?** | Synced favorites across devices. | Client‑side per‑device interim; sync needs an endpoint. | API team | Phase 9 | **None today** — see [backend-gaps](./backend-gaps.md). |
| **Q11** | **Recents endpoint** (expose audit log to the user)? | Server‑backed "recently opened". | Client‑side recents interim; `audit-log.schema.ts` exists but is unexposed. | API team | Phase 9 | **None today** (data exists, no endpoint). |
| **Q12** | **Tags/labels API** (entity + CRUD + filter)? | Organize beyond folders. | Deferred; no interim (tags must be durable/shared). | API team | Phase 9 | **None today**. |
| **Q13** | **Account‑wide insights/aggregate endpoint?** | Global storage breakdown / largest files across all folders. | Client‑side compute for current folder only until then. | API team | Phase 9 | **None today** (totals exist via `StorageUsage`). |

## How to use this file
- When a question is answered, **move it to [DECISIONS.md](./DECISIONS.md)** (as a D‑entry) and link the commit/phase.
- New questions discovered during implementation get added here with the same columns.
- `UNVERIFIED` items must be resolved **before** any feature relies on the unproven behavior.
