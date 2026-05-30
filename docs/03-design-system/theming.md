# Theming — Light / Dark

> Light/dark with **system preference** as default. Tokens drive both themes; components never branch on theme.

## 1. Mechanism
- A `next-themes`‑style provider sets a `class` (`light` / `dark`) on `<html>`; default follows the OS
  (`prefers-color-scheme`).
- A toggle in the shell lets the user override (light / dark / system). Persisted (the one allowed persistence — a UI
  preference, not a secret).
- **All** color comes from [color tokens](./foundations/color.md); the `.dark` scope overrides the CSS variables, so
  components are theme‑agnostic.

## 2. Token strategy
```css
:root        { /* light values */ }
.dark        { /* dark overrides — same token names */ }
@theme inline { /* map every --token → --color-* so Tailwind utilities resolve */ }
```
Add a new color **once** (token) and it works in both themes automatically.

## 3. Cross‑cutting concerns
- **Contrast** holds in both themes (AA) — verify accent/state colors in dark too.
- **Elevation** in dark relies more on `surface-elevated` + `border` than shadow
  ([elevation-borders](./foundations/elevation-borders.md)).
- **Glass** ([glassmorphism](./foundations/glassmorphism.md)) has per‑theme tokens (`.dark` scope): light = white‑ish
  translucency + highlight rim; dark = darker fill, rim does more of the work (keep opacity ≥ ~0.5 so it doesn't go
  muddy). Components never branch on theme for glass — the tokens differ. Honor `prefers-reduced-transparency` →
  fall back to solid `surface-elevated`.
- **Images/thumbnails** sit on neutral surfaces; avoid theme‑dependent backgrounds bleeding into media.
- **Motion** is theme‑independent.

## 4. SSR / flash
- Set the theme class before paint to avoid a flash (next‑themes handles this; verify under Next 16.2 in Phase 0).

## 5. Do / don't
- ✅ `dark:` only for the rare structural tweak; prefer tokens that already differ by theme.
- ❌ No `theme === 'dark' ? '#fff' : '#000'` in component logic — that's what tokens are for.

## 6. Where it's built
Phase 0 ([foundation](../01-roadmap/phases/phase-0-foundation.md)); re‑verified in the
[Phase 7 polish pass](../01-roadmap/phases/phase-7-public-polish.md).
