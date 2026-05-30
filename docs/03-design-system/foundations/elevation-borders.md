# Foundations — Elevation, Borders & Radius

> How surfaces separate from each other. Premium feel leans on **hairline borders + soft shadows + generous radius**,
> not heavy drop shadows.

## 1. Radius
| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | inputs, chips, badges |
| `radius-md` | 8px | buttons, cards, list rows |
| `radius-lg` | 12px | dialogs, popovers, sheets |
| `radius-xl` | 16px | hero/marketing cards |
| `radius-full` | 9999px | avatars, pills, icon buttons |

Set a base `--radius` and derive the rest (shadcn convention).

## 2. Elevation tiers (shadow)
| Tier | Use | Treatment |
|---|---|---|
| `e0` | base content | no shadow; border only |
| `e1` | cards, list hover | subtle shadow (`shadow-sm`) + border |
| `e2` | dropdowns, popovers | `shadow-md`, surface‑elevated bg |
| `e3` | dialogs, modals, command palette | `shadow-lg` + backdrop |
| `e4` | toasts | `shadow-lg`, floats above all |

Dark theme: shadows are weaker; rely more on `surface-elevated` + `border` for separation.

**Glass tiers (signature):** floating chrome and overlays render as **glass** rather than a solid elevated surface —
`glass-chrome` (topbar/sidebar, ~`e2` shadow) and `glass-overlay` (modals/popovers/menus, ~`e3`). Glass adds a 1px
**top‑edge highlight rim** on top of the shadow tier. It's restrained and never applied to content/cards/data. Full
spec + tokens + the reduced‑transparency fallback: **[glassmorphism](./glassmorphism.md)**.

## 3. Borders
- Hairline `1px` using the `border` token; `input` token for fields.
- Prefer **border + subtle shadow** over heavy shadow alone (premium, calm).
- Dividers use `border` at low emphasis; avoid full‑width hard lines where spacing suffices.

## 4. Focus ring (a11y‑critical)
- Visible `ring` token outline on **all** interactive elements on keyboard focus (`focus-visible`).
- 2px ring + 2px offset; never remove focus styles. See [accessibility](../../06-cross-cutting/accessibility.md).

## 5. Do / don't
- ✅ Card = `bg-surface border border-border rounded-md shadow-sm`.
- ✅ Modal = `bg-surface-elevated rounded-lg shadow-lg` + backdrop.
- ❌ No heavy/colored drop shadows for decoration.
- ❌ Never `outline-none` without an equivalent visible focus style.
