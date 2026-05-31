# Foundations — Color

> Semantic color tokens. Components use **token names**, never raw hex. Defined as Tailwind v4 CSS variables in
> `app/globals.css` under `:root` + dark scope, exposed via `@theme inline`. Theming logic:
> [theming](../theming.md).

## 1. Token set (semantic)

| Token | Role | Light (proposed) | Dark (proposed) |
|---|---|---|---|
| `background` | app base | `#ffffff` | `#0a0a0a` |
| `foreground` | base text | `#171717` | `#ededed` |
| `surface` | cards/sheets above base | `#fafafa` | `#141414` |
| `surface-elevated` | popovers/modals | `#ffffff` | `#1c1c1c` |
| `muted` | subtle bg (rows, chips) | `#f4f4f5` | `#1a1a1a` |
| `muted-foreground` | secondary text | `#71717a` | `#a1a1aa` |
| `border` | hairlines/dividers | `#e4e4e7` | `#262626` |
| `input` | input borders | `#e4e4e7` | `#2a2a2a` |
| `ring` | focus ring | accent @ 60% | accent @ 60% |
| `accent` | brand / primary action (**Claude‑style orange**) | `#d97757` | `#e0937a` |
| `accent-foreground` | text on accent | `#ffffff` | `#1a1410` |
| `success` | positive/clean state | `#16a34a` | `#22c55e` |
| `warning` | quota 80/90, caution | `#d97706` | `#f59e0b` |
| `danger` | destructive/delete/error/infected | `#dc2626` | `#ef4444` |
| `info` | neutral notices | `#2563eb` | `#3b82f6` |

> **Palette direction (decided):** a **monochrome base** — black / white / grays for all structure (background, surfaces,
> borders, text). **Color is reserved for actions & states**, not decoration: `danger` (delete/destructive) red,
> `warning` amber, `success` green, `info` blue, and a **single warm accent** (Claude‑style orange `#d97757`) used
> sparingly for the primary action / focus. Finalize exact hexes in Phase 0; **token names are the contract**.
>
> ⚠ **Contrast:** white on `#d97757` is borderline — for **filled** accent controls, deepen the shade toward
> `#c2410c` (or use a dark `accent-foreground`) to hit AA; use the lighter `#d97757` for accents/text‑on‑neutral. Validate
> in Phase 0 ([accessibility](../../06-cross-cutting/accessibility.md)).

### Glass surface tokens (signature look)
Floating **chrome and overlays** use translucent **glass** fills layered on top of these solid tokens — `--glass-chrome-bg`,
`--glass-overlay-bg`, `--glass-border` (highlight rim), plus blur/saturate values. **Content, cards, and data stay
solid** (`background`/`surface`). The full token table, light/dark behavior, legibility floor, and the required
`prefers-reduced-transparency` solid fallback live in **[glassmorphism](./glassmorphism.md)** — read it before using any
translucent surface. (Glass is *additive* to this palette; the solid tokens above are the fallback.)

## 2. State → color mapping (ties to the state matrix)

| Surface state | Token |
|---|---|
| Quota warning (80/90%) | `warning` |
| Quota exceeded (100%) | `danger` |
| AV infected | `danger` |
| AV pending | `warning` (badge) |
| Success toasts / clean | `success` |
| Locked / reveal‑required | `muted` chrome + `accent` CTA |

See [state-matrix](../../02-architecture/state-matrix.md).

## 3. Tailwind v4 wiring

```css
:root {
  --background:#ffffff; --foreground:#171717;
  --surface:#fafafa; --surface-elevated:#ffffff;
  --muted:#f4f4f5; --muted-foreground:#71717a;
  --border:#e4e4e7; --input:#e4e4e7; --ring:#d97757;
  --accent:#d97757; --accent-foreground:#ffffff;   /* deepen toward #c2410c for filled controls (AA) */
  --success:#16a34a; --warning:#d97706; --danger:#dc2626; --info:#2563eb;
}
.dark { /* dark overrides per table */ }

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  /* …one mapping per token → enables bg-surface, text-muted-foreground, border-border, ring-ring, etc. */
}
```

## 4. Do / don't
- ✅ **Monochrome by default:** structure is grayscale (`bg-background`/`bg-surface`/`text-foreground`/`border-border`).
- ✅ Use the warm **`accent` (orange)** *sparingly* — the single primary action / focus per view.
- ✅ Color = meaning: state tokens for state/actions (delete → `danger`), never decoration.
- ❌ No raw hex / arbitrary `bg-[#...]` in components.
- ❌ Don't paint surfaces/chrome with color — keep them neutral; let one accent + state colors do the talking.
- ❌ Don't overload `accent` — destructive actions use `danger`, not accent.
- ❌ Don't rely on color alone to convey state (pair with icon/text — a11y).

## 5. Contrast
All text/background pairs target **WCAG AA** (4.5:1 body, 3:1 large). Verify accent‑foreground on accent and state colors
in both themes. See [accessibility](../../06-cross-cutting/accessibility.md).
