# Cross‑cutting — Performance

> A budget, not vibes. Designed in from [P0](../01-roadmap/phases/phase-0-foundation.md) (code‑splitting, lazy,
> virtualization, LazyMotion, package‑import trimming), measured from [P2](../01-roadmap/phases/phase-2-shell-account.md)
> (web‑vitals RUM), gated in CI from [P7](../01-roadmap/phases/phase-7-public-polish.md). Numbers are the **locked
> working budget** — change them via a [decision record](../07-decisions/DECISIONS.md), not in passing.

## 1. Web Vitals targets (per route group)

Targets are p75 on a mid‑tier mobile (Moto G‑class) over a throttled 4G profile, measured both in lab (Lighthouse CI)
and field (RUM via `web-vitals`).

| Route group | LCP | INP | CLS | TTFB | Notes |
|---|---|---|---|---|---|
| `(public)` landing/features/pricing | < 2.0s | < 200ms | < 0.05 | < 0.6s | SEO‑relevant; RSC‑heavy, minimal JS |
| `(auth)` sign‑in / sign‑up / 2FA | < 2.2s | < 200ms | < 0.1 | < 0.8s | first authenticated paint matters |
| `(app)` shell first paint | < 2.5s | < 200ms | < 0.1 | < 0.8s | shell shown before resource fetch resolves |
| `(app)/storage/[[...path]]` | < 2.8s | < 200ms | < 0.1 | < 1.0s | virtualized list; budget excludes thumbnails |
| `(app)/preview/*` (image/video/doc) | < 3.0s | < 200ms | < 0.1 | < 1.0s | CodeMirror/PDF chunks lazy‑loaded |

Additional non‑Vitals targets:

- **Large folder (10k entries)**: smooth scroll at 60fps with virtualization, no jank during selection.
- **Upload tray open**: < 100ms from click to visible.
- **Route transition** within `(app)`: < 200ms perceived (skeleton/transition state visible immediately).

## 2. Bundle budgets (size-limit)

Budgets are enforced with [`size-limit`](https://github.com/ai/size-limit) on **gzipped** route bundles. Configured in
P0, gated in CI from P7. Budgets fail the build on regression; loosening requires a decision record.

| Bundle | Gzip budget | Notes |
|---|---|---|
| Public landing route JS (initial) | 90 KB | RSC + minimal client interactivity |
| Auth route JS (initial) | 110 KB | password/2FA/passkey forms |
| App shell first‑load JS | 180 KB | shell + providers + Query + Instance |
| Storage route JS (initial, excl. shell) | 70 KB | list/grid + selection + virtualization |
| Preview route JS (initial, excl. shell) | 60 KB | viewer host; CodeMirror/PDF lazy |
| CodeMirror chunk (lazy) | ~235 KB | loaded only on text/code preview (Stage C1; measured `basicSetup` + 7 langs + theme, MIT). The 220 KB was a pre-impl estimate — see D-P4.5. |
| PDF.js chunk (lazy) | 250 KB | loaded only on PDF preview |
| Framer Motion (LazyMotion `domAnimation`) | 25 KB | full `domMax` only on opt‑in routes |

```js
// size-limit.config.js (sketch — added in P0)
module.exports = [
  { name: "public",    path: ".next/static/chunks/app/(public)/**/*.js", limit: "90 KB" },
  { name: "app-shell", path: ".next/static/chunks/app/(app)/layout-*.js", limit: "180 KB" },
  { name: "storage",   path: ".next/static/chunks/app/(app)/storage/**/*.js", limit: "70 KB" },
  { name: "preview",   path: ".next/static/chunks/app/(app)/preview/**/*.js", limit: "60 KB" },
];
```

## 3. List virtualization (TanStack Virtual — locked)

`@tanstack/react-virtual` is the **only** sanctioned virtualization library. The threshold is locked:

> **Any list rendering > 100 entries MUST be virtualized.** No exceptions for "it's usually short" — the bound is on
> the render contract, not the average case.

Applies to: storage list/grid, notifications inbox, duplicate‑group viewer, version history, session list, member
lists in teams, audit log. Each virtualized list owns its own measurement (estimated row height + `measureElement`)
and ships keyboard navigation tests. See [`storage`](../04-features/storage.md), [`notifications`](../04-features/notifications.md).

## 4. `next.config.ts` — package imports

Two compounding levers ship in P0 and are revisited as new heavy deps land. Both reduce initial route JS by pruning barrel re‑exports.

### 4.1 `optimizePackageImports`

Server‑side tree‑shaking hint for packages with index barrels.

```ts
// next.config.ts (sketch)
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@tanstack/react-query",
      "@tanstack/react-virtual",
      "framer-motion",
      "date-fns",
      "recharts",
    ],
  },
};
```

### 4.2 `modularizeImports`

Compile‑time path rewrites for libraries whose barrels can't be trusted to shake.

```ts
modularizeImports: {
  "lucide-react": {
    transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    preventFullImport: true,
  },
  "lodash": {
    transform: "lodash/{{member}}",
    preventFullImport: true,
  },
},
```

`preventFullImport: true` is mandatory — a regression that imports the full barrel must fail compile, not just bloat
the bundle.

## 5. Framer Motion — LazyMotion (locked)

Framer is loaded via **`LazyMotion` with the `domAnimation` feature set** at the app shell root; the heavier `domMax`
set is opt‑in only on routes that need drag/layout (currently none at MVP). All animations use `m.*` components, not
`motion.*` — `motion.*` is lint‑blocked in P0 to prevent the full bundle from being pulled.

```tsx
// app/(app)/layout.tsx (sketch)
import { LazyMotion, domAnimation } from "framer-motion";

<LazyMotion features={domAnimation} strict>
  {children}
</LazyMotion>
```

`strict` throws if any `motion.*` is rendered, which catches the regression at runtime in dev/test. Production behavior
is "render nothing"; the lint rule is the real guardrail. See [design system motion](../03-design-system/DESIGN-SYSTEM.md#motion).

## 6. RUM (web-vitals lib)

Real‑user monitoring uses the [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library (v4+, attribution
build). Wired in P2 alongside [observability](./observability.md); reports the five Core/Loading Vitals (LCP, INP,
CLS, TTFB, FCP) with attribution payloads.

- **Transport**: `navigator.sendBeacon` to the analytics sink; falls back to `fetch(..., {keepalive: true})`.
- **Sampling**: 100% in early phases (low traffic); throttled later via a feature flag.
- **Dimensions**: route group, route segment (no path params), device class, network class, `ownerId` scope kind
  (`personal`/`team`) — **never** the team/user id itself. No PII per [observability §1](./observability.md#1-error-monitoring).
- **Attribution** payloads (LCP element selector, INP target) ship in dev/staging; redacted in prod to selector
  shape only.
- Honors Do‑Not‑Track and the analytics opt‑out from [observability](./observability.md).

## 7. CI gating

Two gates, both **blocking on PR** from P7. Run in parallel after build.

| Gate | Tool | Trigger | Failure action |
|---|---|---|---|
| Bundle budgets | `size-limit` | every PR after `next build` | block merge; comment with diff vs base |
| Web Vitals (lab) | Lighthouse CI (`lhci autorun`) | every PR; runs against a preview deploy | block merge if any §1 target regresses; comment full report |

Lighthouse CI config asserts the §1 targets per route group (separate `lhci` runs per route group with the right
viewport/throttle profile). A regression on `(public)` LCP is treated as a P0 — landing perf is SEO.

```yaml
# .github/workflows/perf.yml (sketch)
- run: bun run build
- run: bun run size-limit
- run: bunx lhci autorun --config=./lighthouse-ci.config.js
```

Nightly: a `lhci` run against production with no PR gating, feeding a trend dashboard.

## 8. Other techniques (designed in, not separately gated)

- **Route code‑splitting** via App Router segments; heavy areas lazy‑loaded.
- **Lazy CodeMirror / PDF.js** — loaded only when the corresponding preview opens.
- **Image strategy**: lazy thumbnails; CDN‑scaled sizes (`?w=&h=` via `cdn.storage.umutk.me` → wsrv.nl; HMAC‑signed
  base URL is opaque, append resize query). Responsive sizes for grid vs preview vs fullscreen.
- **Query caching** with explicit `staleTime` per resource; avoid waterfalls; prefetch on hover where it measurably helps.
- **Pagination/infinite** via envelope `Options.Count` ([data-layer](../02-architecture/data-layer.md)).
- **Network**: batch presign (`GetMultipartPartUrls`); concurrency caps; `AbortSignal` on route change.
- **Motion** ≤320ms, GPU‑friendly (transform/opacity), disabled under `prefers-reduced-motion`.

## 9. Phase ownership

| Phase | Owns |
|---|---|
| [P0 Foundation](../01-roadmap/phases/phase-0-foundation.md) | `next.config.ts` (`optimizePackageImports` + `modularizeImports`); `LazyMotion` at shell root; `motion.*` lint rule; `size-limit` config + scripts (not yet CI‑gating); TanStack Virtual installed and the 100‑entry lint convention documented |
| [P2 Shell & Account](../01-roadmap/phases/phase-2-shell-account.md) | `web-vitals` RUM wiring + sink; route‑group + device/network dimensions; DNT/opt‑out respected |
| [P3 Storage Core](../01-roadmap/phases/phase-3-storage-core.md) | Virtualized list/grid hits the §1 storage targets; upload concurrency caps verified |
| [P4 Preview & Share](../01-roadmap/phases/phase-4-preview-share.md) | CodeMirror + PDF.js chunked under their §2 budgets; preview route hits §1 |
| [P6 Advanced](../01-roadmap/phases/phase-6-advanced.md) | Duplicate viewer + version history virtualized; job store doesn't regress shell budget |
| [P7 Public & Polish](../01-roadmap/phases/phase-7-public-polish.md) | CI gating turned on (`size-limit` + Lighthouse CI); public LCP target met; full budget audit |
| [P8 Teams](../01-roadmap/phases/phase-8-teams.md) | Team scope additions don't regress shell budget; member list virtualized |

## 10. Open items

- Pick the RUM sink (own endpoint vs. third‑party). Default assumption: own endpoint behind the analytics flag.
- Decide whether to add `bundlewatch` alongside `size-limit` (current bias: skip — one gate is enough).
- Lighthouse CI: run against Vercel preview deploys vs. a local `next start` in CI. Preview gives realer numbers but
  couples CI to deploy timing.
- Confirm `domMax` truly isn't needed at MVP (drag, layout animations). Revisit in P6 polish if layout transitions land.
- Define the budget‑bump review process: who approves, and the decision‑record template entry.

## Cross‑refs

- [data-layer](../02-architecture/data-layer.md) · [design system](../03-design-system/DESIGN-SYSTEM.md)
- [storage](../04-features/storage.md) · [preview](../04-features/preview.md) · [public](../04-features/public.md)
- [observability](./observability.md) · [seo-metadata](./seo-metadata.md) · [testing](./testing.md)
- [P0 Foundation](../01-roadmap/phases/phase-0-foundation.md) · [P7 Public & Polish](../01-roadmap/phases/phase-7-public-polish.md)
- [decisions](../07-decisions/DECISIONS.md)
