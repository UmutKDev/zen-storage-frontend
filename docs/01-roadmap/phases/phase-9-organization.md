# Phase 9 — Organization & Discovery (post‑MVP, backend‑gated)

> **Status:** ⏳ not started · **Depends on:** [Phase 3](./phase-3-storage-core.md) (+ backend APIs that don't exist yet).
> **Nature:** mostly **gated on backend work** — see [backend-gaps](../../07-decisions/backend-gaps.md). Order vs
> [Phase 8 (Teams)](./phase-8-teams.md) is flexible; both are post‑MVP.

## Objective
Turn the MVP's **client‑side interims** into real, synced organization & discovery — once the backend exposes the APIs:
synced **favorites/recents**, **tags/labels**, and account‑wide **storage insights**.

## ⚠ Precondition: backend APIs
This phase **cannot fully ship without backend work.** Each task names the API it needs. Until then, MVP runs the
client‑side interim or keeps the surface disabled (behind a [feature flag](../../06-cross-cutting/feature-flags.md)).
Open questions: Q10 (favorites), Q11 (recents), Q12 (tags), Q13 (aggregate insights).

## Scope
**In (when APIs exist):** synced favorites + recents; tags/labels (CRUD + assign + filter + tag view); account‑wide
insights + cleanup.
**Out:** anything still without an API (stays interim/disabled). **Sharing is out** — it's resolved at MVP via presigned
URL ([sharing](../../04-features/sharing.md)).

## Task breakdown

### 9.1 — Synced Favorites + Recents → [quick-access](../../04-features/quick-access.md)
- [ ] **Needs API (Q10/Q11).** Swap the `useFavorites`/`useRecents` hooks from local interim to the real factory.
- [ ] Fold scope into team‑prefixed query keys; drop the "on this device" caveat.

### 9.2 — Tags / labels → [tags](../../04-features/tags.md)
- [ ] **Needs API (Q12).** Tag CRUD (create/rename/recolor/delete); assign/unassign (single + bulk); list‑by‑tag + tag
      filter on search; tag chips on cards/rows (slot already reserved).

### 9.3 — Account‑wide insights → [storage-insights](../../04-features/storage-insights.md)
- [ ] **Needs API (Q13).** Enable the "All files" scope; replace client‑side current‑folder compute with the server
      aggregate; account‑wide largest files + cleanup recommendations.

> **Sharing is NOT in this phase.** [Q1 is resolved](../../07-decisions/open-questions.md): `Cloud/PresignedUrl` is the
> share mechanism (MVP, [sharing](../../04-features/sharing.md)); no managed share‑link backend is planned.

## Acceptance‑test checklist (per sub‑feature, once its API lands)
- [ ] Favorites/recents sync across devices; team‑scoped; interim caveat removed.
- [ ] Tags: create/assign/filter/tag‑view all work; bulk assign; chips render.
- [ ] Insights: account‑wide breakdown + largest files + cleanup; numbers reconcile with `StorageUsage`.
- [ ] Every upgraded feature flips its [feature flag](../../06-cross-cutting/feature-flags.md) on with no UI rewrite.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| APIs never materialize | MVP already works via interim/disabled; no MVP dependency on this phase. |
| Interim → real data migration (favorites/recents) | Funnel through one hook; offer a one‑time import of local favorites if useful. |
| Cache/key changes on going synced | Team‑prefixed keys from Phase 0 make this localized. |

## Exit criteria
Each organization/discovery feature is **real and synced** (not interim), gated only by its API's availability; the UI
required **no rewrite** to upgrade — only the data layer changed.
