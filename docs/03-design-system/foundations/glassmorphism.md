# Foundations — Glassmorphism (signature surface treatment)

> Glass is the app's **signature look** — frosted, translucent **chrome** floating over a calm base. But it is applied
> with **discipline**: tasteful, easy on the eyes, premium. Overusing it (glass on everything, heavy blur, busy
> backdrops, low‑contrast text) is the failure mode we explicitly reject. This file is the contract for *where*, *how
> much*, and *never*.
>
> Builds on [color](./color.md) + [elevation-borders](./elevation-borders.md); theming in [theming](../theming.md);
> a11y in [accessibility](../../06-cross-cutting/accessibility.md). Philosophy: [DESIGN-SYSTEM](../DESIGN-SYSTEM.md)
> ("premium, not decorated").

## 1. The one rule: **glass on chrome, calm underneath**

Glass only reads as premium when there's a quiet surface for it to sit on and just enough behind it to refract. So:

- **Glass goes on floating/elevated chrome and overlays** — topbar, sidebar, modals, popovers, command palette, upload
  tray, notification panel, context menus.
- **The base stays calm and mostly solid** — the content area, file rows/cards, forms, and tables are **not** glass.
- **At most a *very* subtle ambient backdrop** (a soft, low‑contrast gradient/wash) sits behind everything so glass has
  something to refract — never a busy photo/mesh that fights the content.

This single principle prevents the "boku çıkmış" (overdone) result. If you're unsure whether a surface should be glass,
the answer is **no** — keep it solid.

## 2. Where glass IS / ISN'T used

| Surface | Glass? | Tier |
|---|---|---|
| Topbar / app header | ✅ | `glass-chrome` |
| Sidebar | ✅ (subtle) | `glass-chrome` |
| Modals / dialogs / preview shell | ✅ | `glass-overlay` |
| Popovers, dropdowns, context menus, tooltips | ✅ | `glass-overlay` |
| Command palette / search | ✅ | `glass-overlay` |
| Upload tray, notification inbox panel | ✅ | `glass-overlay` |
| Toasts | ✅ (light touch) | `glass-overlay` |
| **Content area background** | ❌ solid `background` | — |
| **File rows / cards** | ❌ solid `surface` | — |
| **Forms, inputs, tables, settings panels** | ❌ solid `surface` | — |
| **Empty/error/loading states** | ❌ solid | — |
| **Dense data (large folders, lists)** | ❌ solid (perf + legibility) | — |

Rule of thumb: **chrome and overlays = glass; content and data = solid.**

## 3. Glass tokens

Two tiers only (more tiers = inconsistency). Each is a thin translucent fill + saturate‑boosted blur + a hairline
**top‑edge highlight** + a soft shadow. Values are deliberately **restrained**.

| Token | `glass-chrome` (bars/sidebar) | `glass-overlay` (modals/popovers) |
|---|---|---|
| `--glass-bg` (light) | `rgba(255,255,255,0.62)` | `rgba(255,255,255,0.72)` |
| `--glass-bg` (dark) | `rgba(20,20,22,0.55)` | `rgba(24,24,27,0.66)` |
| `--glass-blur` | `12px` | `16px` |
| `--glass-saturate` | `140%` | `150%` |
| `--glass-border` (highlight) | `rgba(255,255,255,0.18)` light / `rgba(255,255,255,0.08)` dark | same |
| `--glass-shadow` | `e2` (soft) | `e3` (soft, larger) — see [elevation](./elevation-borders.md) |

Design intent baked into the numbers:
- **Opacity stays high enough to read** (55–72%), so text/icons keep contrast — this is the single biggest anti‑tacky
  lever. Overlays are *more* opaque than chrome because they carry primary content.
- **Blur is moderate** (12–16px), not extreme. Heavy blur looks cheap and costs performance.
- **Saturate (~140–150%)** gives the "premium frosted" feel without raising opacity.
- **Highlight border** is a 1px inner top edge (light, low alpha) that gives the pane a crisp lit rim — the detail that
  separates premium glass from a flat translucent box.

> These are **starting values, tunable in Phase 0**. The *token names and the two‑tier model* are the contract;
> the exact alphas/px get dialed in against the real palette.

### 3a. Micro‑glass (the disciplined third tier — control fills ONLY)

The premium realization adds one further, **deliberately constrained** tier for translucent **control fills** — the
`outline`/`secondary` button fills get a faint frosted backing + the 1px highlight rim, so they read as machined glass
rather than flat boxes. It is NOT a general surface tier: never on data rows, cards, tables, or badges.

| Token | value (light) | value (dark) |
|---|---|---|
| `--glass-micro-bg` | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.06)` |
| `--glass-blur-micro` | `8px` (faintest) | `8px` |
| `--glass-highlight` | `rgba(255,255,255,0.35)` | `rgba(255,255,255,0.14)` |

`--glass-highlight` is also the shared 1px inner top‑edge rim used across the machined `.zs-*` treatments (tiles,
panels, emblems, breadcrumb chip). Like the two main tiers, micro‑glass **falls back to a solid fill** under
`prefers-reduced-transparency` / `prefers-contrast: more` (see [§6](#6-accessibility--honor-reduce-transparency)). The
contract is still "glass on chrome/overlays/controls, calm underneath" — three tiers, no more.

## 4. Light vs dark behavior

- **Light:** glass = white‑ish translucency + highlight rim; shadow does the separating.
- **Dark:** glass = dark translucency; the **highlight rim does more of the work** (shadows are weak in dark, per
  [elevation-borders](./elevation-borders.md)). Keep dark glass from going muddy: don't drop below ~0.5 opacity.
- Tokens differ by theme via the `.dark` scope (same names) — components never branch on theme. See
  [theming](../theming.md).

## 5. Legibility (non‑negotiable)

Glass must never cost text contrast.

- Text/icons on a glass pane must still meet **WCAG AA** (4.5:1 body) against the **effective** background (assume a
  worst‑case mid‑tone behind the blur). When in doubt, **raise the pane opacity**, don't darken the text arbitrarily.
- For text‑dense glass (e.g. notification inbox), add a slightly more opaque inner content layer behind the text rather
  than relying on blur alone.
- Never place small/low‑weight text directly over an unblurred busy region. The ambient backdrop (if any) must stay
  low‑contrast precisely so this is safe.

## 6. Accessibility — honor "reduce transparency"

- Respect **`prefers-reduced-transparency`** (and treat `prefers-contrast: more` the same): **drop the blur and
  translucency, fall back to a solid `surface-elevated`** with the normal border + shadow. The layout is identical; only
  the fill changes.
- This is required, exactly like `prefers-reduced-motion` is for animation
  ([reduced-motion](../motion/reduced-motion.md)). Provide a single `glass` utility/wrapper that bakes in the fallback so
  no component forgets it.
- Focus rings, hit targets, and contrast rules from [accessibility](../../06-cross-cutting/accessibility.md) apply
  unchanged on glass surfaces.

## 7. Performance (backdrop‑filter is expensive)

- **Limit simultaneous glass layers.** A handful on screen (topbar + sidebar + one overlay) is fine; dozens (every row)
  is not — another reason data surfaces stay solid.
- **No nested glass** (glass inside glass) — it compounds blur cost and looks muddy.
- **Never animate `backdrop-filter`/blur.** Animate opacity/transform on the glass pane (existing `modal`/`popover`
  variants), keep the blur static. See [motion/variants](../motion/variants.md).
- Be cautious with `will-change`; prefer letting the compositor handle it. Test scroll perf with a glass topbar over a
  long virtualized list.

## 8. Implementation (Tailwind v4)

Define the tokens once and expose a small set of utilities/wrappers — components use the wrapper, never raw
`backdrop-blur` + arbitrary colors.

```css
/* globals.css */
:root {
  --glass-chrome-bg: rgba(255,255,255,0.62);
  --glass-overlay-bg: rgba(255,255,255,0.72);
  --glass-border: rgba(255,255,255,0.18);
  --glass-blur-chrome: 12px;
  --glass-blur-overlay: 16px;
  --glass-saturate: 140%;
}
.dark {
  --glass-chrome-bg: rgba(20,20,22,0.55);
  --glass-overlay-bg: rgba(24,24,27,0.66);
  --glass-border: rgba(255,255,255,0.08);
}

/* one utility per tier — includes the highlight rim + the reduced-transparency fallback */
@utility glass-chrome {
  background: var(--glass-chrome-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: 0 1px 0 0 var(--glass-border) inset; /* top highlight rim */
}
@utility glass-overlay {
  background: var(--glass-overlay-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur-overlay)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur-overlay)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: 0 1px 0 0 var(--glass-border) inset;
}

/* required fallback — solid surface when the user reduces transparency / contrast */
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass-chrome, .glass-overlay {
    background: var(--surface-elevated);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

Usage is then just the wrapped primitive (e.g. the `Dialog`/`Sheet`/topbar wrapper in `components/ui/*`) applying
`glass-overlay` / `glass-chrome` + radius + the right `e2`/`e3` shadow. Plain components never hand‑roll
`backdrop-blur-[..] bg-white/30`.

## 9. Do / don't

- ✅ Glass on topbar, sidebar, modals, popovers, tray, command palette — over a calm base.
- ✅ Keep opacity high enough to read; moderate blur; one crisp highlight rim; soft shadow.
- ✅ Provide the `prefers-reduced-transparency` solid fallback on every glass surface.
- ✅ Keep content, cards, tables, and dense lists **solid**.
- ❌ No glass on every card / on the content background / on data rows.
- ❌ No extreme blur, no <0.5 opacity, no busy photo/mesh backdrops behind text.
- ❌ No nested glass; no animating blur.
- ❌ No raw `bg-white/20 backdrop-blur-xl` in components — use the `glass-*` utility/wrapper.

## 10. Where it's built
Tokens + utilities land in **Phase 0** ([foundation](../../01-roadmap/phases/phase-0-foundation.md)) alongside the rest
of the design system; the chrome/overlay wrappers that apply them are introduced as those surfaces are built (shell in
Phase 2, modals/popovers from Phase 3–4). Re‑checked in the [Phase 7 polish pass](../../01-roadmap/phases/phase-7-public-polish.md).
