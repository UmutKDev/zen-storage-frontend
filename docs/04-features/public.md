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
**Decided ([Q6](../07-decisions/open-questions.md)):** the page is **"coming soon"** for now, and the cards will be shaped
by a **dedicated pricing‑page endpoint** — a purpose‑built endpoint **for this page specifically** (not the generic
admin plan‑list). **That endpoint doesn't exist yet** → to be built on the backend ([backend-gaps](../07-decisions/backend-gaps.md)).
**Endpoints:** (planned) **`GET /Api/Subscription/Pricing`** *(name TBD — dedicated pricing‑page payload)*;
`Subscription/My` to highlight the current plan if signed in.
**Behavior:** **no checkout** — each plan shows a "coming soon" CTA. **Until the endpoint ships, render static cards.**
**States:** loading/empty (when the endpoint exists); static fallback meanwhile; signed‑out shows generic cards.

## Cross‑cutting for public pages
- **SEO/metadata** via Next metadata API (titles, descriptions, OG, robots/sitemap) — [seo-metadata](../06-cross-cutting/seo-metadata.md).
- Responsive + accessible; same tokens/motion as the app.
- RSC where possible for fast first paint.
