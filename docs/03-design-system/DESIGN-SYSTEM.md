# Design System — index

> How the v2 frontend **looks and moves**. A premium feel built on **shadcn/ui + Tailwind v4**, with **framer‑motion**
> as a first‑class part of the system. This folder is the single source of truth for tokens, motion, components, and
> theming. Built in [Phase 0](../01-roadmap/phases/phase-0-foundation.md); obeyed by every feature.

## Map

| Area | Files |
|---|---|
| **Foundations** | [color](./foundations/color.md) · [typography](./foundations/typography.md) · [spacing-layout](./foundations/spacing-layout.md) · [elevation-borders](./foundations/elevation-borders.md) · [glassmorphism](./foundations/glassmorphism.md) |
| **Motion** | [tokens](./motion/tokens.md) · [variants](./motion/variants.md) · [reduced-motion](./motion/reduced-motion.md) |
| **Components** | [primitives](./components/primitives.md) · [patterns](./components/patterns.md) |
| **Theming** | [theming](./theming.md) |

## Philosophy — "premium, not decorated"

1. **Restraint over flash.** Premium = precise spacing, calm color, crisp type, and *purposeful* motion — not heavy
   effects. Every animation earns its place.
2. **Motion is part of the system.** Durations, easings, and variants are **tokens** shared across the app (see
   [motion](./motion/tokens.md)) — never hand‑tuned per component. **Every** animation respects
   [`prefers-reduced-motion`](./motion/reduced-motion.md).
3. **shadcn via MCP, then customize.** Pull primitives/blocks with the **shadcn MCP** (don't hand‑copy source), then
   wrap them in `components/ui/*` for the premium look. **Don't fork gratuitously** — wrap and theme.
4. **Tokens, not hex.** Components reference **semantic tokens** (`bg-background`, `text-foreground`, surfaces, borders,
   accent, state colors) defined in Tailwind v4 `@theme inline`. No raw colors in components.
5. **Accessible by construction.** Contrast, focus visibility, and motion‑safety are design requirements, not QA
   afterthoughts. See [`../06-cross-cutting/accessibility.md`](../06-cross-cutting/accessibility.md).
6. **Glass is the signature — used with discipline.** Frosted translucent **chrome** (topbar, sidebar, modals,
   popovers) floats over a **calm, solid base**; content and data stay solid. Restrained blur/opacity, a crisp highlight
   rim, AA legibility, and a `prefers-reduced-transparency` solid fallback. Overdone glass (everything translucent, heavy
   blur, busy backdrops) is explicitly rejected. Full contract: [glassmorphism](./foundations/glassmorphism.md).

## Current baseline (to extend in Phase 0)
`app/globals.css` today defines only `--background` / `--foreground` (light + dark via `prefers-color-scheme`) and the
Geist font vars under `@theme inline`. Phase 0 extends this to the full semantic palette + scales below.

## How features consume this
A [feature spec](../04-features/FEATURE-MAP.md) never invents colors, spacing, or animations — it references these
tokens/variants. If a feature needs something new, **add it here first**, then use it.

## Token namespace overview

```
color      → MONOCHROME base (black/white/grays) + ONE warm accent (Claude-style orange) + state(success,warning,danger,info); color reserved for actions/states
glass      → glass-chrome / glass-overlay (bg alpha · blur · saturate · highlight border) — signature, chrome+overlays only
type       → font sans/mono · size scale · weight · line-height · tracking
space      → 4px-based scale · container widths · radii
elevation  → shadow tiers · border treatments · focus ring
motion     → duration(fast/base/slow) · easing(standard/decelerate/accelerate/spring) · distance · variants
```
Each is specified in its file with concrete values + Tailwind mapping + do/don't.
