# Phase 9 — Organization & Discovery (post‑MVP, backend‑gated)

> **Status:** ⏳ not started · **Depends on:** [Phase 3](./phase-3-storage-core.md) (+ backend APIs that don't exist yet).
> **Nature:** mostly **gated on backend work** — see [backend-gaps](../../07-decisions/backend-gaps.md). Order vs
> [Phase 8 (Teams)](./phase-8-teams.md) is flexible; both are post‑MVP.

## Objective
Build the organization & discovery layer **once the backend exposes the APIs** (none shipped in MVP — backend‑first, no
interim): synced **favorites/recents**, **tags/labels**, and account‑wide **storage insights**.

## ⚠ Precondition: backend APIs
This phase **cannot ship without backend work.** Each task names the API it needs. Until then the surfaces stay
**disabled** (behind a [feature flag](../../06-cross-cutting/feature-flags.md)) — **no client‑side interim** (decided).
Open questions: Q10 (favorites), Q11 (recents), Q12 (tags), Q13 (aggregate insights).

## Scope
**In (when APIs exist):** synced favorites + recents; tags/labels (CRUD + assign + filter + tag view); account‑wide
insights + cleanup.
**Out:** anything still without an API (stays disabled). **Sharing is out** — it's resolved at MVP via presigned
URL ([sharing](../../04-features/sharing.md)).

## Task breakdown

### 9.1 — Favorites + Recents → [quick-access](../../04-features/quick-access.md)
- [ ] **Needs API (Q10/Q11).** Build `useFavorites`/`useRecents` on the real factories (no prior interim to migrate).
- [ ] Quick Access strip (favorites + recents rows); star affordance; team‑prefixed query keys.

### 9.2 — Tags / labels → [tags](../../04-features/tags.md)
- [ ] **Needs API (Q12).** Tag CRUD (create/rename/recolor/delete); assign/unassign (single + bulk); list‑by‑tag + tag
      filter on search; tag chips on cards/rows (slot already reserved).

### 9.3 — Storage insights → [storage-insights](../../04-features/storage-insights.md)
- [ ] **Needs API (Q13).** Build the insights panel on the aggregate endpoint: by‑type breakdown, largest files,
      account‑wide totals + cleanup recommendations (links to duplicate scan).

> **Sharing is NOT in this phase.** [Q1 is resolved](../../07-decisions/open-questions.md): `Cloud/PresignedUrl` is the
> share mechanism (MVP, [sharing](../../04-features/sharing.md)); no managed share‑link backend is planned.

## Acceptance‑test checklist (per sub‑feature, once its API lands)
- [ ] Favorites/recents sync across devices; team‑scoped.
- [ ] Tags: create/assign/filter/tag‑view all work; bulk assign; chips render.
- [ ] Insights: account‑wide breakdown + largest files + cleanup; numbers reconcile with `StorageUsage`.
- [ ] Every upgraded feature flips its [feature flag](../../06-cross-cutting/feature-flags.md) on with no UI rewrite.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| APIs never materialize | These surfaces stay flagged‑off; **MVP has no dependency** on this phase. |
| Scope creep (each needs entity + CRUD + UI) | Ship one feature at a time as its API lands; reuse existing patterns (FileCard slots, etc.). |
| Cache/key scoping | Team‑prefixed keys from Phase 0 make adding these localized. |

## Exit criteria
Each organization/discovery feature is **real and synced** (built on its backend API), gated only by that API's
availability; the frontend patterns reserved during MVP let each one drop in without restructuring.
