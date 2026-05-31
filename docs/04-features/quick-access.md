# Feature — Quick Access: Favorites + Recents 🟡 (backend‑gated)

> Starred items + recently‑opened, surfaced for fast re‑access (Drive/Yandex‑style).
> ⚠ **Backend reality:** there is **no favorites or recents API today** ([backend-gaps](../07-decisions/backend-gaps.md),
> Q10/Q11). MVP ships a **client‑side, per‑device interim**; the synced version is **post‑MVP** ([phase-9](../01-roadmap/phases/phase-9-organization.md)).

## What ships at MVP (client‑side interim) — optional in Phase 3
- **Favorites (local):** star/unstar an item; a "Favorites" view lists them. Stored **per‑device** (the one allowed
  client persistence — a UI preference, not server data), clearly labeled "on this device".
- **Recents (local):** items the user opened/previewed on this device, most‑recent first, capped (e.g. 50).
- Both live behind a **feature flag** ([feature-flags](../06-cross-cutting/feature-flags.md)) so they can be turned off
  or swapped to the real API without UI churn.

## Screen / placement
- A **Quick Access** strip at the top of the storage root (collapsible): "Recents" row + "Favorites" row, each a
  horizontal `FileCard` list.
- Star affordance on `FileCard`/`FileRow` and in the preview toolbar.

## Components
`QuickAccessStrip`, reuse `FileCard`/`FileRow` + `FileIcon`, star toggle, `EmptyState` ("No favorites yet").

## Endpoints
- **None for favorites/recents** (no API). The list is resolved from local state; each item is still **validated/opened**
  via the real `Cloud/Find` / listing endpoints (so a deleted/moved item is detected and pruned).
- **Do not invent** a favorites endpoint — funnel all reads/writes through one `useFavorites` / `useRecents` hook so the
  interim → real‑API swap is a single localized change.

## States (matrix)
empty (no favorites / no recents) · item‑now‑missing (validated via `Cloud/Find` → prune + toast) · loading (resolving
metadata) · device‑scope note ("synced favorites coming"). See [state-matrix](../02-architecture/state-matrix.md).

## Edge cases
- A favorited/recent item that was deleted, moved, or is inside a now‑locked encrypted folder → resolve gracefully
  (prune or show locked).
- Per‑device honesty: never imply favorites sync across devices until the API exists.

## Post‑MVP (synced) → [phase-9](../01-roadmap/phases/phase-9-organization.md)
When a favorites API (Q10) and/or a recents endpoint over the audit log (Q11) land: switch the `useFavorites`/`useRecents`
hooks to the real factory, fold the scope into team‑prefixed query keys, and drop the "on this device" caveat.
