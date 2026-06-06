/**
 * Default values for the typed feature-flag registry (`lib/flags/registry.ts`).
 * Flags are frontend-only at MVP; a real remote source can override these later.
 */
export const flagDefaults = {
  /** Command palette (⌘K) — lands in Phase 3, plumbing ready from Phase 0. */
  commandPalette: true,
  /** First-run onboarding tour — finished in Phase 7. */
  onboarding: false,
  /** Team workspace switching — activates in Phase 8. */
  teams: false,
} as const;

export type FlagDefaults = typeof flagDefaults;
