# Motion — Reduced Motion

> `prefers-reduced-motion` support is a **hard requirement** for every animation, not a nice‑to‑have.

## 1. The gate
```ts
// lib/motion/useMotionVariants.ts
import { useReducedMotion } from 'framer-motion';

export function useMotionVariants(full, reduced) {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reduced : full;
}
```
Components ask for a variant through this gate; they never read the media query themselves.

## 2. Reduced forms
| Full | Reduced |
|---|---|
| scale + fade (modal) | opacity‑only, instant or `fast` |
| slide + fade (page, sheet, toast) | opacity‑only, no translate |
| list stagger + rise | no stagger, no translate (instant or single fade) |
| hover lift / press scale | none (or color‑only feedback) |
| progress tween | keep (functional, communicates state) — but no decorative pulse |

Rule of thumb: **remove movement (translate/scale), keep meaning.** Functional motion that communicates state
(progress, a loading spinner) may stay but must not pulse/bounce.

## 3. Coverage
- `pageTransition`, `modal`, `popover`, `listStagger`, `listItem`, `hover`, `press`, `toast` all ship a reduced form.
- Route `loading.tsx` skeletons: shimmer → static placeholder under reduced motion.

## 4. Verification (acceptance)
- With OS "reduce motion" on, no element translates or scales decoratively; transitions are instant or simple fades.
- This is part of the [Phase 0 acceptance checklist](../../01-roadmap/phases/phase-0-foundation.md#acceptance-test-checklist)
  and re‑checked in the [Phase 7 polish pass](../../01-roadmap/phases/phase-7-public-polish.md).
