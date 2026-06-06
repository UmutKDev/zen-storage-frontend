/**
 * Motion tokens — durations, easings, spring, and distances shared across the
 * app. Motion is part of the design system: never hand-tune these per component;
 * compose variants from them (see `variants.ts`). Premium motion is quick and
 * crisp. Every consumer pairs with `useReducedMotion`.
 */

type Bezier = [number, number, number, number];

/** Seconds (framer-motion uses seconds). */
export const duration = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
} as const;

export const easing = {
  standard: [0.2, 0, 0, 1] as Bezier,
  decelerate: [0, 0, 0, 1] as Bezier,
  accelerate: [0.4, 0, 1, 1] as Bezier,
} as const;

export const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

/** Pixels. */
export const distance = {
  nudge: 4,
  rise: 8,
  slide: 16,
} as const;
