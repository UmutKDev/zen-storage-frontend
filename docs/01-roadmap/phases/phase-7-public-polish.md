# Phase 7 — Public & Polish (MVP completes here)

> **Status:** ⏳ not started · **Depends on:** Phases 0–6. · **Outcome:** **MVP ships.**
> **Feature spec:** [public](../../04-features/public.md) · **Cross‑cutting:** [accessibility](../../06-cross-cutting/accessibility.md)
> · [performance](../../06-cross-cutting/performance.md) · [seo-metadata](../../06-cross-cutting/seo-metadata.md)

## Objective
Ship the **public pages** and run the **cross‑app polish pass** that turns a feature‑complete app into a shippable MVP:
responsiveness, accessibility baseline, performance budget, animation polish, full state‑matrix coverage, and SEO.

## Scope
**In:** landing, features, pricing ("coming soon"); responsive pass; a11y baseline; performance budget; animation
polish; full empty/error/loading coverage everywhere; SEO/metadata for public pages.
**Out:** marketing CMS; real checkout (Pricing stays "coming soon").

## Task breakdown

### 7.1 — Public pages → see [public](../../04-features/public.md)
- [ ] Landing (hero + sections; motion entrances; reduced‑motion).
- [ ] Features page (static).
- [ ] Pricing **"coming soon"**: show plans (`Subscription/My` + plan list if exposed, else static cards), highlight
      current plan, **no checkout** (see open Q6 for data source).

### 7.2 — Responsiveness
- [ ] Mobile/tablet/desktop pass across shell, storage list/grid, preview modal, dialogs, account.

### 7.3 — Accessibility baseline → see [accessibility](../../06-cross-cutting/accessibility.md)
- [ ] Keyboard reachability + visible focus; dialog focus trapping; roles/labels; `aria-live` for async; color contrast.

### 7.4 — Performance budget → see [performance](../../06-cross-cutting/performance.md)
- [ ] Route code‑splitting; lazy CodeMirror; image lazy‑load + thumbnail strategy; list virtualization confirmed;
      bundle check against the budget.

### 7.5 — Animation polish & state coverage
- [ ] Consistent variants on entrances/transitions; verify **every** surface has empty/error/loading states
      (cross‑check [state-matrix](../../02-architecture/state-matrix.md)).

### 7.6 — SEO / metadata → see [seo-metadata](../../06-cross-cutting/seo-metadata.md)
- [ ] Next metadata API for public routes; titles/descriptions/OG; robots/sitemap basics.

### 7.7 — Onboarding & observability finish (added scope)
- [ ] **Onboarding / first‑run**: welcome, guided empty states, first‑upload coachmarks — dismissible, flagged,
      reduced‑motion aware. See [onboarding](../../04-features/onboarding.md).
- [ ] **Observability verification**: errors report with readable stacks + **no PII**; analytics honors opt‑out/DNT and
      is off in dev. See [observability](../../06-cross-cutting/observability.md).
- [ ] **PWA / offline is explicitly post‑MVP** ([pwa-offline](../../06-cross-cutting/pwa-offline.md)) — confirm nothing
      in this phase blocks it (clean Instance/Query cache boundary; secure data never cached).

## Endpoints used
`Subscription/My` (+ plan list if exposed). Contracts: [subscription](../../05-api/modules/subscription.md).

## Acceptance‑test checklist
- [ ] Public pages live; Pricing shows plans in "coming soon" state (no checkout).
- [ ] App is usable on small screens (all key surfaces).
- [ ] Accessibility baseline passes (keyboard, focus, labels, contrast); automated a11y check is clean on key routes.
- [ ] Performance budget met (Lighthouse/perf targets in the perf doc).
- [ ] Every surface has empty/error/loading; animations are consistent and reduced‑motion‑aware.
- [ ] Public routes have correct metadata.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Polish scope creep | Fixed checklist + performance budget; defer nice‑to‑haves. |
| Pricing data source (open Q6) | Use `Subscription/My` + static cards if no public plan list. |

## Rollback / fallback
Pricing falls back to fully static cards if no plan endpoint is exposed. Perf items can be tuned post‑MVP if budgets are
close but not blocking.

## Exit criteria
**MVP is complete:** the full Personal experience is live, public pages are up, and the app is responsive, accessible,
performant, animated, and internationalization‑ready. Then (post‑MVP) begin [Phase 8](./phase-8-teams.md).
