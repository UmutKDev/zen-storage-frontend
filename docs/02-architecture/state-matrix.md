# State Matrix

> The **full** set of states every list/preview/action surface must handle — beyond loading/empty/error. If a surface
> doesn't account for one of these, it's incomplete. Referenced by every [feature spec](../04-features/FEATURE-MAP.md).

## The matrix

| State | Trigger | UX |
|---|---|---|
| **Loading** | query pending | skeletons (motion‑aware; reduced‑motion → instant) |
| **Empty folder** | 0 items | empty illustration + primary actions (upload / create) |
| **No search results** | search → 0 | "no results" + clear / broaden scope |
| **Network / server error** | transport / 5xx | typed‑error message + retry affordance |
| **Locked (encrypted)** | 403 / no folder session | passphrase prompt (unlock) — [secure folders](./secure-folder-lifecycle.md) |
| **Reveal‑required (hidden)** | hidden, no hidden session | `Shift Shift` reveal prompt |
| **AV pending** | `Scan/Status` pending | badge; downloads gated/warned |
| **AV infected** | `Scan/Status` infected | block or warn‑on‑download |
| **Quota warning** | 80 / 90% (socket) | banner/toast + upgrade hint |
| **Quota exceeded** | 100% / pre‑flight block | block upload + clear message + upgrade |
| **Permission denied** | (Teams, Phase 8) CASL 403 for VIEWER | disabled actions + explanation |

## How surfaces use it

- **Route boundaries** ([routing](./routing-deep-linking.md)) cover **loading** and **error** at the segment level.
- **Inside the page**, the feature handles empty / no‑results / locked / reveal‑required / AV / quota / permission.
- Each [feature spec](../04-features/FEATURE-MAP.md) lists *which* of these states apply to *that* surface (not all
  apply everywhere — e.g. AV applies to files, not the account page).

## Mapping to data

| State | Source signal |
|---|---|
| Loading / error | TanStack Query status + `ApiError` |
| Empty / no‑results | list `Count` = 0 (with/without active search) |
| Locked / reveal‑required | `403` + secure‑folder store has no valid token |
| AV pending/infected | `Cloud/Scan/Status` |
| Quota warning/exceeded | socket `QUOTA_WARNING/EXCEEDED` + `Cloud/User/StorageUsage` + upload pre‑flight |
| Permission denied | CASL `403` under team context (Phase 8) |

## Rule
A feature is **not done** until every applicable state is implemented, i18n‑keyed, and accessible (e.g. `aria-live` for
async transitions). See [CONVENTIONS §9](../00-overview/CONVENTIONS.md#9-definition-of-done-for-a-task).
