# Cross‑cutting — SEO & Metadata

> Mostly relevant to the **public** pages (the app is behind auth). Handled via the Next metadata API.
> Built in [Phase 7](../01-roadmap/phases/phase-7-public-polish.md). Feature: [public](../04-features/public.md).

## 1. Scope
- **Public routes** (`(public)`: landing, features, pricing) get full SEO treatment.
- **App routes** (`(app)`) are private → `noindex`; metadata is for tab titles/UX, not search.

## 2. Per‑route metadata (Next metadata API)
- Title + description per public page (unique, descriptive).
- **Open Graph** + Twitter card (title, description, image) for shareable public pages.
- Canonical URLs; language meta (EN at MVP).
- App pages: `robots: { index:false }`; meaningful `<title>` per section for the tab.

## 3. Site‑level
- `robots.txt` (allow public, disallow `(app)` paths).
- `sitemap.xml` for public routes.
- Favicon/app icons live at `public/favicon.ico` (moved in P0; keeps `app/` thin per Next‑16 conventions); add full
  icon set + manifest if PWA‑ish polish is wanted (optional, post‑MVP).

## 4. Performance ↔ SEO
- LCP/CLS on landing matter for SEO — see [performance](./performance.md). RSC for fast first paint where possible.

## 5. Acceptance
- Each public route has correct title/description/OG; app routes are `noindex`; robots/sitemap present.
- Verified in the [Phase 7 checklist](../01-roadmap/phases/phase-7-public-polish.md#76--seo--metadata--see-seo-metadata).
