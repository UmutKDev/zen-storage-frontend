# Feature — Tags / Labels ⚪ (deferred — backend‑gated)

> Organize files beyond the folder tree with colored tags + tag filtering.
> ⚠ **Backend reality:** **no tags/labels API or entity exists** ([backend-gaps](../07-decisions/backend-gaps.md), Q12).
> Unlike favorites/recents, tags are **not shipped as a client‑side interim** — tags are only useful if durable and
> (later) shareable, and a per‑device fake would mislead. **Deferred to [phase-9](../01-roadmap/phases/phase-9-organization.md).**

## Why no interim
A local‑only tag would vanish on another device and couldn't be searched server‑side — that's worse than no tags. We
document the design now so that when the API lands, the UI drops in cleanly.

## Intended design (for when the API exists)
- **Tag chips** on `FileCard`/`FileRow` (colored, from a small palette aligned to [color tokens](../03-design-system/foundations/color.md)).
- **Tag management:** create/rename/recolor/delete tags; assign/unassign on single + bulk selection.
- **Filter by tag** in the storage toolbar; combine with search scope ([storage-search-filter](./storage-search-filter.md)).
- **Tag view:** a virtual folder listing all items with a given tag.

## Endpoints needed (request to API team — Q12)
- Tag entity + CRUD (`create/list/rename/recolor/delete`).
- Assign/unassign tag ↔ object (single + bulk).
- List objects by tag (paginated, team‑scoped) and/or a tag filter on `Cloud/Search`.

## Frontend readiness now
- Reserve a `tags` slot in the `FileCard`/`FileRow` patterns ([patterns](../03-design-system/components/patterns.md)) so
  adding chips later is non‑structural.
- Keep the toolbar filter extensible to accept a tag filter without a redesign.

No MVP work beyond these non‑structural affordances.
