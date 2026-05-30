# Feature — Public Pages (Phase 7) 🟢 / 🟡

> Marketing surface in the `(public)` route group. SEO: [seo-metadata](../06-cross-cutting/seo-metadata.md).

## Landing — `(public)/page` 🟢
**Layout:** hero + feature sections + CTA to sign up. Motion entrances (`pageTransition`/`listStagger`), reduced‑motion
aware. **Endpoints:** none. **States:** static.

## Features — `(public)/features` 🟢
**Layout:** sectioned feature highlights (storage, security, collaboration‑coming). **Endpoints:** none. **States:**
static.

## Pricing — `(public)/pricing` 🟡 "coming soon"
**Layout:** plan cards (free / pro / enterprise style), highlight current plan if signed in.
**Endpoints:** `Subscription/My` (current plan if available); plan list **if** a public endpoint is exposed, else
**static cards** ([open Q6](../07-decisions/open-questions.md)).
**Behavior:** **no checkout** — each plan shows a "coming soon" CTA instead of purchase.
**States:** loading/empty if plans come from the API; signed‑out shows generic cards.

## Cross‑cutting for public pages
- **SEO/metadata** via Next metadata API (titles, descriptions, OG, robots/sitemap) — [seo-metadata](../06-cross-cutting/seo-metadata.md).
- Responsive + accessible; same tokens/motion as the app.
- RSC where possible for fast first paint.
