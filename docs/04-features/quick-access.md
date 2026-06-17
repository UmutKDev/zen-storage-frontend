# Feature — Quick Access: Favorites + Recents ⚪ (post‑MVP — backend‑first)

> Starred items + recently‑opened, surfaced for fast re‑access (Drive/Yandex‑style).
> **Decided ([Q10/Q11](../07-decisions/open-questions.md)):** these **will** be built, but **backend‑first** — they need
> real APIs and are **not in MVP** (no client‑side interim). Deferred to
> [phase-9](../01-roadmap/phases/phase-9-organization.md). ⚠ **No backend support today**
> ([backend-gaps](../07-decisions/backend-gaps.md)).

## Why no MVP interim
A local, per‑device favorites/recents list would not sync and would mislead users into thinking it's server state. Per
the **no‑faking rule** (D‑S8), we wait for the real endpoints rather than ship a fake. MVP stays focused on the storage
core.

## Intended design (for when the APIs exist)
- **Quick Access strip** at the top of the storage root (collapsible): a "Recents" row + a "Favorites" row, each a
  horizontal `FileCard` list.
- **Star** affordance on `FileCard`/`FileRow` and in the preview toolbar.
- Items resolve/open via the normal `Cloud/Find` / listing endpoints (stale entries prune).
- Scope folds into **team‑prefixed** query keys ([state-management](../02-architecture/state-management.md)).

## Endpoints needed (request to the API team — Q10/Q11)
- **Favorites:** star/unstar + list favorites (team‑scoped).
- **Recents:** a recently‑opened endpoint (the `audit-log` Mongo schema already records activity — expose a user‑facing,
  paginated view of it).

## Frontend readiness now (non‑structural)
- Reserve a star slot on the `FileCard`/`FileRow` patterns ([patterns](../03-design-system/components/patterns.md)) and a
  `quickAccess` feature flag (off) so the strip can drop in later without restructuring.

No MVP work beyond these non‑structural affordances. Full build: [phase-9](../01-roadmap/phases/phase-9-organization.md).
