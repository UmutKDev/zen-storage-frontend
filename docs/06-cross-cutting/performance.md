# Cross‑cutting — Performance

> A budget, not vibes. Enforced through [Phase 7](../01-roadmap/phases/phase-7-public-polish.md) but designed in from
> Phase 0 (code‑splitting, lazy, virtualization).

## 1. Budget (targets)
| Metric | Target |
|---|---|
| LCP (public landing) | < 2.5s on a mid‑tier device / 4G |
| TTI (app shell) | < 3.5s |
| Route JS (initial, app) | keep lean — code‑split heavy routes |
| CLS | < 0.1 |
| Large folder (10k items) | smooth scroll (virtualized), no jank |

(Finalize exact numbers in Phase 7; treat these as the working budget.)

## 2. Techniques
- **Route code‑splitting** via App Router segments; heavy areas lazy‑loaded.
- **Lazy CodeMirror** — only load the editor when a text file is opened ([preview](../04-features/preview.md)).
- **Image strategy:** lazy‑load thumbnails; request **CDN‑scaled sizes** (`?w=&h=` **supported** via `cdn.storage.umutk.me`
  → wsrv.nl; base URL HMAC‑signed via rustfs — treat as opaque, append resize query);
  responsive sizes for grid vs preview vs fullscreen.
- **List virtualization** (`@tanstack/react-virtual`) for storage list/grid, notifications, large duplicate groups.
- **Query caching** (TanStack) with sensible `staleTime`; avoid waterfalls; prefetch on hover where it helps.
- **Pagination/infinite** using envelope `Options.Count` ([data-layer](../02-architecture/data-layer.md)).
- **Motion** kept short (≤320ms) and GPU‑friendly (transform/opacity), disabled under reduced‑motion.

## 3. Network
- Batch presign for uploads (`GetMultipartPartUrls`) instead of per‑part round‑trips.
- Concurrency limits on uploads to avoid saturating the connection.
- Cancellation (`AbortSignal`) on route change so stale requests don't pile up.

## 4. Measurement
- Lighthouse on public + key app routes; bundle analysis on build.
- Track the budget in CI (fail/flag on regressions) where feasible.

## 5. Where it's enforced
Designed across all phases; formal pass + budget verification in
[Phase 7 §7.4](../01-roadmap/phases/phase-7-public-polish.md#74--performance-budget--see-performance).
