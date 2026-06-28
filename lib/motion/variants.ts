import type { Variants } from "framer-motion";
import { distance, duration, easing, spring } from "./tokens";

/**
 * Reusable framer-motion variants composed from tokens. Components import these;
 * they never inline `animate={{ … }}` with magic numbers. All degrade under
 * reduced motion (the gate swaps to opacity-only / instant — see
 * `useReducedMotion`).
 */

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: distance.slide },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: easing.standard },
  },
  exit: {
    opacity: 0,
    y: -distance.slide,
    transition: { duration: duration.base, ease: easing.accelerate },
  },
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.base, ease: easing.decelerate },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: duration.fast, ease: easing.accelerate },
  },
};

export const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const popover: Variants = {
  hidden: { opacity: 0, y: -distance.nudge },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easing.decelerate },
  },
  exit: {
    opacity: 0,
    y: -distance.nudge,
    transition: { duration: duration.fast, ease: easing.accelerate },
  },
};

export const listStagger: Variants = {
  visible: { transition: { staggerChildren: 0.03 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: distance.rise },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.decelerate },
  },
};

export const hover: Variants = {
  rest: { y: 0 },
  hover: {
    y: -distance.nudge,
    transition: { duration: duration.fast, ease: easing.decelerate },
  },
};

export const press: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.98, transition: spring },
};

export const toast: Variants = {
  hidden: { opacity: 0, y: distance.rise },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.decelerate },
  },
  exit: {
    opacity: 0,
    y: distance.rise,
    transition: { duration: duration.fast, ease: easing.accelerate },
  },
};

/**
 * Bulk-selection action bar — a touch heavier than `toast`: it rises and settles
 * from a subtle scale-down so the floating glass pill reads as arriving with
 * weight. Token-based, no spring (a spring scale on a wide bar feels bouncy). The
 * global `MotionConfig reducedMotion="user"` strips the transforms to opacity.
 */
export const bulkBar: Variants = {
  hidden: { opacity: 0, y: distance.rise, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.base, ease: easing.decelerate },
  },
  exit: {
    opacity: 0,
    y: distance.rise,
    scale: 0.98,
    transition: { duration: duration.fast, ease: easing.accelerate },
  },
};

/** Progress bars use a tween (precision), never spring. */
export const progress: Variants = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: { duration: duration.base, ease: easing.standard },
  },
};
