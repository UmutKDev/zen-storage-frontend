"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Boolean gate for `prefers-reduced-motion`. Components use this to swap a
 * motion variant for an instant/opacity-only form. `MotionConfig
 * reducedMotion="user"` already neutralizes transform/layout animations
 * globally; this hook is for explicit conditional logic.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
