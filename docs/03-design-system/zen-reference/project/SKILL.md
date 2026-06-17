---
name: zen-storage-design
description: Use this skill to generate well-branded interfaces and assets for Zen Storage, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Quick orientation:
- `readme.md` — product context, content fundamentals, visual foundations, iconography, hard rules.
- `styles.css` — single CSS entry point (tokens, fonts, glass utilities, component classes). Link it from any HTML.
- `tokens/` — colors, typography, spacing, elevation, glass, motion as CSS custom properties (light + `.dark`).
- `components/` — React primitives (Button, Badge, Input, Dialog, GlassPanel, FileRow, UsageBar…). In this project load `_ds_bundle.js` and read them from the design-system namespace; in production follow `reference/docs/` (Tailwind v4 semantic tokens + shadcn wrappers).
- `ui_kits/zen-storage-app/` — interactive recreation of the app (login, storage browser, command palette, preview, account).
- `assets/fonts/` — real Geist/Geist Mono woff2; `assets/icons/` — common Lucide SVGs. Icons: Lucide only (CDN UMD or copied SVGs) — never emoji, never hand-drawn.

Non-negotiables: monochrome structure with ONE orange accent (`#d97757`, filled controls `#c2410c`); color only for actions/states; glass on chrome/overlays only (two tiers, solid fallback); tokenized motion (120/200/320ms) respecting reduced-motion; WCAG AA, visible focus, ≥40px targets; sentence case, terse verb-first copy, no emoji.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
