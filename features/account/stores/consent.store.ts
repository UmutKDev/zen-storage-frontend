import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cookie/consent state (KVKK + GDPR). Feature-local. Essential is always on
 * (contract/legitimate-interest basis); functional + analytics default OFF and
 * are opt-in. Persisted to localStorage (a UI preference, not a secret — the
 * persist ban applies only to the secure-folders store). See
 * docs/06-cross-cutting/privacy-compliance.md §3.
 */
export type ConsentCategory = "functional" | "analytics";

/** Bump when the privacy policy changes, to re-prompt consent. */
export const CONSENT_VERSION = "2026-06-06";

interface ConsentState {
  essential: true;
  functional: boolean;
  analytics: boolean;
  version: string;
  decidedAt: string | null;
  setConsent: (category: ConsentCategory, value: boolean) => void;
  reset: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      essential: true,
      functional: false,
      analytics: false,
      version: CONSENT_VERSION,
      decidedAt: null,
      setConsent: (category, value) =>
        set(
          () =>
            ({
              [category]: value,
              decidedAt: new Date().toISOString(),
            }) as Partial<ConsentState>,
        ),
      reset: () =>
        set({ functional: false, analytics: false, decidedAt: null }),
    }),
    { name: "consent", version: 1 },
  ),
);
