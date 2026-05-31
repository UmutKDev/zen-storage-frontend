# Feature Map — index

> Every user‑facing feature → screen(s) → endpoint(s) → states. This file is the **master index**; each area has a
> detailed spec file with layout, components, keyboard/interaction notes, and edge cases.
> Endpoints: [`../05-api/`](../05-api/API-INVENTORY.md) · States: [state-matrix](../02-architecture/state-matrix.md) ·
> Components: [patterns](../03-design-system/components/patterns.md) · Phases: [ROADMAP](../01-roadmap/ROADMAP.md).

Legend: 🟢 MVP · 🟡 MVP‑light / "coming soon" · ⚪ post‑MVP (Teams/dev API).

## Area → spec → phase

| Area | Spec file | Phase | Key endpoints |
|---|---|---|---|
| Auth | [auth.md](./auth.md) | 1 | `Authentication/*` |
| Account & Security | [account.md](./account.md) | 2 | `Account/*`, `Account/Security/*`, `Subscription/My` |
| Storage — browse | [storage-browse.md](./storage-browse.md) | 3 | `Cloud/List*`, `/Breadcrumb`, `/User/StorageUsage` |
| Storage — upload | [storage-upload.md](./storage-upload.md) | 3 | `Cloud/Upload/*` |
| Storage — operations | [storage-operations.md](./storage-operations.md) | 3 | `Cloud/Move`,`/Delete`,`/Update`,`Directory`,`Documents` |
| Storage — search/filter | [storage-search-filter.md](./storage-search-filter.md) | 3 | `Cloud/Search` |
| Preview & edit | [preview.md](./preview.md) | 4 | `Cloud/Find`,`/PresignedUrl`,`/Versions`,`Documents/*` |
| Sharing 🟢 | [sharing.md](./sharing.md) | 4 | `Cloud/PresignedUrl` (signed time‑limited link — **the** share mechanism) |
| Secure folders | [secure-folders.md](./secure-folders.md) | 5 | `Cloud/Directory/Unlock`…`/Conceal` |
| Advanced | [advanced.md](./advanced.md) | 6 | `Scan/Duplicate/*`,`Archive/*`,`Scan/Status`,`Notification/*` |
| Public | [public.md](./public.md) | 7 | `Subscription/My` |
| Onboarding 🟢 | [onboarding.md](./onboarding.md) | 7 | none (frontend) |
| Quick Access (favorites/recents) ⚪ | [quick-access.md](./quick-access.md) | 9 | **none — backend‑first, post‑MVP, no interim** (Q10/Q11) |
| Storage insights ⚪ | [storage-insights.md](./storage-insights.md) | 9 | **needs aggregate API** (Q13); only `StorageUsage` totals today |
| Tags / labels ⚪ | [tags.md](./tags.md) | 9 | **none — backend‑gated** (Q12) |
| Teams (post‑MVP) | [teams.md](./teams.md) | 8 | `Team/*` + `Cloud/*` under `X-Team-Id` |
| Organization & Discovery (post‑MVP) | [phase-9](../01-roadmap/phases/phase-9-organization.md) | 9 | **backend‑gated** (favorites/recents/tags/insights/share) |

> ⚠ **Backend support:** several of the above (favorites, recents, tags, global insights) have **no API today**, and
> **avatar upload exists but is inactive** — see [backend-gaps](../07-decisions/backend-gaps.md). They ship as a labeled
> deferred (backend‑first, no interim); we never fake server‑backed behavior. (Sharing = presigned URL, resolved;
> image CDN resize via wsrv.nl, resolved.)

## Cross‑cutting (apply to every area) 🟢
| Concern | Where | Doc |
|---|---|---|
| Light/dark theme | shell toggle | [theming](../03-design-system/theming.md) |
| i18n (EN, keys) | all copy | [i18n](../06-cross-cutting/i18n.md) |
| Motion + reduced‑motion | all animation | [motion](../03-design-system/motion/variants.md) |
| Conflict resolution | upload/create/move/rename | [conflict-resolution](../02-architecture/conflict-resolution.md) |
| Error/envelope layer | all calls | [data-layer](../02-architecture/data-layer.md) |
| State matrix | all surfaces | [state-matrix](../02-architecture/state-matrix.md) |

## Coverage note
All product features are represented. **Share = presigned‑URL** (no backend share API); **Trash = intentionally absent**
(delete UX leaves room); **Teams = scaffolded but inert** until Phase 8; **audio/office preview = post‑MVP** (open Q4).
