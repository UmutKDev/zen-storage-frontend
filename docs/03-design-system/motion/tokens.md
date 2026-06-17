# Motion — Tokens

> Shared `framer-motion` values in `lib/motion/`. **Motion is part of the design system** — durations and easings are
> tokens, never hand‑tuned per component. Always paired with [reduced-motion](./reduced-motion.md).

## 1. Duration tokens
| Token | Value | Use |
|---|---|---|
| `fast` | 120ms | hover/press micro‑interactions, small fades |
| `base` | 200ms | most transitions (modal, dropdown, list item) |
| `slow` | 320ms | page transitions, large surfaces, emphasis |

Keep durations short — premium motion is **quick and crisp**, not lingering.

## 2. Easing tokens
| Token | Curve | Use |
|---|---|---|
| `standard` | `[0.2, 0, 0, 1]` | most in/out transitions |
| `decelerate` | `[0, 0, 0, 1]` | entrances (ease‑out) |
| `accelerate` | `[0.4, 0, 1, 1]` | exits (ease‑in) |
| `spring` | `{ type:'spring', stiffness:300, damping:30 }` | playful press/drag, sheet snap |

## 3. Distance tokens
| Token | Value | Use |
|---|---|---|
| `nudge` | 4px | press/hover shift |
| `rise` | 8px | list/card entrance offset |
| `slide` | 16px | sheet/drawer/page slide |

## 4. Definition (shape)
```ts
// lib/motion/tokens.ts
export const duration = { fast: 0.12, base: 0.2, slow: 0.32 } as const;
export const easing = {
  standard:   [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.4, 0, 1, 1],
} as const;
export const spring = { type: 'spring', stiffness: 300, damping: 30 } as const;
export const distance = { nudge: 4, rise: 8, slide: 16 } as const;
```

## 5. Rules
- Compose **variants** ([variants](./variants.md)) from these tokens; never inline magic numbers in components.
- Entrances use `decelerate`; exits use `accelerate`; symmetric transitions use `standard`.
- Respect `prefers-reduced-motion` everywhere — the gate swaps to instant/opacity‑only
  ([reduced-motion](./reduced-motion.md)).
