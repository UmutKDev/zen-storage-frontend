# Feature — Storage Insights & Cleanup ⚪ (post‑MVP — backend‑first)

> Help the user understand and reclaim space: usage breakdown, largest files, cleanup suggestions.
> **Decided ([Q13](../07-decisions/open-questions.md)):** insights will be **backend‑driven** (an aggregate endpoint) and
> are **not in MVP** — deferred to [phase-9](../01-roadmap/phases/phase-9-organization.md). ⚠ Only **totals** exist today
> (`Cloud/User/StorageUsage`); there is **no insights/aggregate endpoint** ([backend-gaps](../07-decisions/backend-gaps.md)).

## What MVP already has (not "insights", just the basics)
- **Usage bar** (`Cloud/User/StorageUsage`): % used / limit, near‑limit color. This ships in the storage core (Phase 3),
  reusing the `UsageBar` pattern — it's not the full insights feature.
- **Duplicate cleanup savings** come from the duplicate scan (Phase 6).

## Intended design (for when the aggregate endpoint exists)
- **Insights panel** reachable from the usage bar ("Manage storage") and the account/subscription area.
- **By type** (account‑wide): images/video/docs/text/archives/other breakdown.
- **Largest files** (account‑wide), oldest/unused candidates.
- **Cleanup**: links into duplicate scan + large/old items → delete/move.

## Endpoints needed (request to the API team — Q13)
- An **aggregate/insights endpoint**: per‑type totals + largest files, account‑wide (and later team‑scoped). Don't
  fabricate account‑wide numbers from a single folder listing.

## Frontend readiness now
- Keep a lightweight, dependency‑free chart approach in mind (respect the [perf budget](../06-cross-cutting/performance.md));
  reserve the `insightsGlobal` flag (off). No MVP build. Full feature: [phase-9](../01-roadmap/phases/phase-9-organization.md).
