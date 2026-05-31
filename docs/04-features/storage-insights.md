# Feature — Storage Insights & Cleanup 🟡 (partial — backend‑gated for global)

> Help the user understand and reclaim space: usage breakdown, largest files, cleanup suggestions.
> ⚠ **Backend reality:** **totals** are supported (`Cloud/User/StorageUsage`) and **duplicate savings** exist
> (`Scan/Duplicate`), but there is **no account‑wide aggregate/insights endpoint** ([backend-gaps](../07-decisions/backend-gaps.md),
> Q13). MVP does **current‑folder, client‑side** insights; global aggregate is post‑MVP
> ([phase-9](../01-roadmap/phases/phase-9-organization.md)).

## What ships at MVP (client‑side, current scope)
- **Usage header:** % used / limit, near‑limit color (from `Cloud/User/StorageUsage`). Reuses the `UsageBar` pattern.
- **By type (current folder):** breakdown by category (images/video/docs/text/archives/other) computed **client‑side**
  from the loaded listing's `Extension`/`MimeType`/`Size`.
- **Largest files (current folder):** top‑N by `Size` from the listing.
- **Cleanup hooks:** entry points to **Duplicate scan** (savings, Phase 6) and to large/old items → delete/move.

## Screen / placement
- An **Insights** panel reachable from the usage bar ("Manage storage") and the account/subscription area.
- Clear scoping label: "This folder" vs the deferred "All files" (disabled with a "coming soon" hint until Q13).

## Components
`InsightsPanel`, `UsageBar`, a small bar/breakdown chart (lightweight — respect the [perf budget](../06-cross-cutting/performance.md);
no heavy chart lib if avoidable), `FileRow` list for largest items, link to `DuplicateScanPanel`.

## Endpoints
- `Cloud/User/StorageUsage` (totals) ✅
- `Cloud/List*` (the folder listing the breakdown is computed from) ✅
- `Cloud/Scan/Duplicate/*` (cleanup savings) ✅
- **Global aggregate:** ❌ none — needs an endpoint (Q13). Don't fabricate account‑wide numbers from partial data.

## States (matrix)
loading (computing) · empty (folder has no files) · global‑disabled ("all‑files insights coming") · quota warning/
exceeded coloring. See [state-matrix](../02-architecture/state-matrix.md).

## Honesty rule
Never present **current‑folder** numbers as **account‑wide**. The global view stays explicitly disabled until the
aggregate endpoint exists.

## Post‑MVP (global) → [phase-9](../01-roadmap/phases/phase-9-organization.md)
When the aggregate endpoint (Q13) lands: enable the "All files" scope, swap client compute for the server aggregate, and
add account‑wide largest‑files + cleanup recommendations.
