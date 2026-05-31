# Backend Gaps — feature ↔ API support matrix

> **The honest list of what the backend does NOT support yet.** Several desired features have **no API today**; we
> document them so the UI is designed right, but we **do not fake server‑backed behavior.** Where it adds value we ship a
> clearly‑labeled **client‑side interim** (per‑device) and flag the gap for the API team.
>
> Verified against `nestjs-storage` controllers (`src/modules/**/**.controller.ts`) + `src/entities` + `src/schemas` on
> 2026-05-30. Companion: [API-INVENTORY](../05-api/API-INVENTORY.md) · [open-questions](./open-questions.md) ·
> [MVP-DEFINITION](../00-overview/MVP-DEFINITION.md).

## Legend
- ✅ **Supported** — endpoint(s) exist; build normally.
- ⚠️ **Partial** — some primitive exists; the full feature needs more (often a new aggregate endpoint).
- ❌ **None** — no endpoint/entity; needs backend work. UI may ship a **client‑side interim** or be **deferred**.

## Matrix

| Feature | Backend status | Evidence (verified) | Frontend strategy |
|---|---|---|---|
| **Favorites / starred** | ❌ None | No `favorite/star/bookmark/pin` controller; no entity in `src/entities` | **Client‑side interim** (local, **per‑device**, not synced) in Phase 3 *optional*; synced version → [phase-9](../01-roadmap/phases/phase-9-organization.md), needs API. |
| **Recents / recently opened** | ❌ None (data exists, unexposed) | No `recent` controller; **`audit-log.schema.ts` exists** (Mongo) but no user‑facing endpoint | **Client‑side interim** (local recents) in Phase 3 *optional*; server‑backed recents (from audit) → needs an endpoint, post‑MVP. |
| **Tags / labels** | ❌ None | No `tag/label` controller or entity (the 24 `tag` hits are `@ApiTags` Swagger decorators, not a feature) | **Deferred** to [phase-9](../01-roadmap/phases/phase-9-organization.md); needs entity + CRUD + filter API. No interim (tags must be durable/shared to be useful). |
| **Storage insights — totals** | ✅ Supported | `Cloud/User/StorageUsage` (used/limit/%) | Use directly (usage bar + insights header). |
| **Storage insights — by type / largest files (current folder)** | ⚠️ Partial | Listings expose `Size`/`Extension`/`MimeType`; no aggregate endpoint | **Client‑side compute** over the loaded folder listing (MVP‑light). |
| **Storage insights — global/account‑wide aggregate** | ❌ None | No analytics/insights/aggregate controller | **Deferred**; needs an aggregate endpoint ([phase-9](../01-roadmap/phases/phase-9-organization.md)). |
| **Duplicate‑based cleanup savings** | ✅ Supported | `Cloud/Scan/Duplicate/*` (groups + savings) | Feed the insights "cleanup" section (Phase 6). |
| **Image CDN resize (`?w=&h=`)** | ✅ Supported | CDN `cdn.storage.umutk.me` reverse‑proxies images via **wsrv.nl**; object URLs are **HMAC‑signed** (rustfs) | Build scaled URLs by appending `?w/?h` to the opaque signed URL ([Q5](./open-questions.md) resolved). |
| **Sharing** | ✅ Supported (by design) | `Cloud/PresignedUrl` — signed, time‑limited link | **This *is* the share mechanism** ([Q1](./open-questions.md) resolved); no managed share‑link backend planned. [sharing](../04-features/sharing.md). |
| **Trash / recycle bin** | ❌ None | No trash endpoint (known) | **Not in MVP** (D4); delete UX leaves room for a future restore. |
| **Onboarding / first‑run** | ✅ N/A (frontend) | — | Pure frontend; uses existing profile/usage reads. Phase 7. |
| **Command palette + keyboard shortcuts** | ✅ N/A (frontend) | — | Pure frontend over existing endpoints (search, navigate, actions). Phases 0/3. |
| **Observability (error monitoring + product analytics)** | ✅ N/A (frontend) | — | Third‑party SDKs client‑side; optional backend log sink later. Phase 0. |
| **Feature flags** | ❌ None (no module) — but N/A | No feature‑flag module in `src` | **Frontend‑only** flags (env/config/local) — no backend needed for MVP. Phase 0. [feature-flags](../06-cross-cutting/feature-flags.md). |
| **PWA / offline** | ✅ N/A (frontend) | — | Service worker + read cache; write queue. Post‑MVP. |

## Exists but **inactive / incomplete** (endpoint present, not usable yet)
Distinct from "missing" — these endpoints exist in the API but **aren't active/finished**, so the frontend can't rely on
them yet. Bring them into the flow once the backend completes them.

| Endpoint | What it's for | Status | Frontend plan |
|---|---|---|---|
| `POST /Api/Account/Upload/Image` | Update the user's **avatar** (profile picture) | **Inactive — not usable yet** (per the project owner) | **Defer to post‑MVP.** Phase 2 shows the avatar (read) but the **upload action is disabled/hidden** behind a flag until the backend activates it; then wire `useUploadAvatar` + re‑fetch profile ([Q7](./open-questions.md)). |

> Add any other "exists‑but‑inactive" endpoints here as they're discovered, so this file is the single place to see both
> **missing** features (matrix above) and **inactive** ones.

## Rules these gaps impose
1. **No faking.** A feature that needs server state we don't have is either a **labeled client‑side interim** (per‑device,
   clearly communicated) or **deferred** — never a fake that looks synced.
2. **Design the UI anyway.** Specs exist ([quick-access](../04-features/quick-access.md),
   [tags](../04-features/tags.md), [storage-insights](../04-features/storage-insights.md),
   [sharing](../04-features/sharing.md)) so that when the API lands, only the data layer changes.
3. **One place to upgrade.** Each gated feature funnels through a single hook/service so swapping interim → real API is a
   localized change (no UI rewrite).
4. **Track every gap** as an open question for the API team (below).

## Open questions raised for the API team
These are added to [open-questions.md](./open-questions.md): a Favorites API (Q10), a Recents endpoint over audit logs
(Q11), a Tags/labels API (Q12), and an account‑wide insights/aggregate endpoint (Q13). MVP does not block on any of them.
(Sharing — Q1 — is **resolved**: presigned URL is the mechanism, no share backend needed.)
