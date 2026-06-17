# Motion — Variants

> Reusable `framer-motion` variants composed from [tokens](./tokens.md). Components import these; they don't define
> their own animations. All variants degrade via [reduced-motion](./reduced-motion.md).

## 1. Catalog

| Variant | Where | Behavior |
|---|---|---|
| `pageTransition` | route content | fade + `slide` (16px), `slow`/`standard` |
| `modal` | dialogs, preview, sheets | scale `0.96→1` + fade, `base`/`decelerate` in, `accelerate` out; backdrop fade |
| `popover` | dropdowns, menus, tooltips | fade + `nudge`, `fast` |
| `listStagger` | file grid/list, notifications | container staggers children ~30ms; each child fade + `rise` |
| `listItem` | a single row/card | fade + `rise` (8px), `base`/`decelerate` |
| `hover` | cards, buttons | `nudge` lift + subtle shadow, `fast` |
| `press` | buttons, draggables | scale `0.98`, `spring` |
| `toast` | sonner toasts | slide‑in + fade, `base`; exit `accelerate` |
| `progress` | upload/job bars | width tween, `standard` (no spring — reads as precise) |

## 2. Example definitions
```ts
// lib/motion/variants.ts
import { duration, easing, distance } from './tokens';

export const modal = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easing.decelerate } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: duration.fast, ease: easing.accelerate } },
};

export const listStagger = {
  visible: { transition: { staggerChildren: 0.03 } },
};
export const listItem = {
  hidden:  { opacity: 0, y: distance.rise },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.decelerate } },
};
```

## 3. Usage rules
- One source of truth: import from `lib/motion/variants`; never inline `animate={{ ... }}` with magic numbers.
- **Stagger only short lists/visible window** — virtualized large folders should not stagger hundreds of rows (cap or
  disable beyond N).
- Drag (dnd‑kit) uses `press`/`spring`; the move/upload distinction stays visually clear
  ([upload-pipeline](../../02-architecture/upload-pipeline.md)).
- Progress bars use **tween**, not spring (precision over playfulness).

## 4. Reduced motion
Every variant has a reduced form (opacity‑only or instant). The `useReducedMotion` gate selects it — see
[reduced-motion](./reduced-motion.md). This is required, not optional.
