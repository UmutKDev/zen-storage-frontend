# Cross‑cutting — PWA / Offline ⚪ (post‑MVP)

> Installable app + basic offline resilience. ✅ Frontend‑only (service worker), but **larger effort with low MVP
> value** → **post‑MVP** ([MVP-DEFINITION](../00-overview/MVP-DEFINITION.md)). Documented now so MVP choices don't block
> it later.

## Scope (when we do it)
- **Installable PWA:** web app manifest + icons (favicon already present), theme color matching the glass/dark palette.
- **Offline reads:** cache the app shell + recently viewed listings/metadata so the app opens and shows last‑known state
  offline (read‑only).
- **Offline writes:** queue uploads/mutations and replay on reconnect — **hard**; relies on the resilient
  [upload pipeline](../02-architecture/upload-pipeline.md) (idempotency keys help). Likely a later increment.

## MVP‑now obligations (so PWA isn't blocked later)
- Keep network access funneled through the [Instance](../02-architecture/data-layer.md) + TanStack Query (a clean cache
  boundary to later back with a service worker).
- Don't assume always‑online in error states — the state matrix already includes network errors with retry.
- Idempotency on Move/Delete/CompleteMultipartUpload (already required) makes replay safe.

## Risks
- Service‑worker caching vs. fresh data correctness (stale listings); secure‑folder content must **never** be cached
  (tokens never persisted — [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md)).
- Cache invalidation complexity; SW update/version flow.

## Acceptance (post‑MVP)
Installable; opens offline with last‑known read‑only state; queued writes replay on reconnect; secure‑folder data is
never cached.
