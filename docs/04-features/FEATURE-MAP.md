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
| Preview & Share | [preview.md](./preview.md) | 4 | `Cloud/Find`,`/PresignedUrl`,`/Versions`,`Documents/*` |
| Secure folders | [secure-folders.md](./secure-folders.md) | 5 | `Cloud/Directory/Unlock`…`/Conceal` |
| Advanced | [advanced.md](./advanced.md) | 6 | `Scan/Duplicate/*`,`Archive/*`,`Scan/Status`,`Notification/*` |
| Public | [public.md](./public.md) | 7 | `Subscription/My` |
| Teams (last) | [teams.md](./teams.md) | 8 | `Team/*` + `Cloud/*` under `X-Team-Id` |

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
