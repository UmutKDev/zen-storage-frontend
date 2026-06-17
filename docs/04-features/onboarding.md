# Feature — Onboarding & First‑Run 🟢 (frontend‑only)

> A premium first impression: welcome, empty‑state guidance, and gentle first‑upload nudges.
> ✅ **No backend dependency** — built from existing profile/usage reads. MVP, Phase 7.

## Goals
- Make a brand‑new (empty) account feel intentional, not broken.
- Get the user to their **first successful upload** fast.
- Surface the premium feel (glass chrome, calm motion) from second one.

## Surfaces
| Surface | When | Content |
|---|---|---|
| **Welcome** (first sign‑in) | profile has no prior activity | brief value + "Upload your first file" CTA; dismissible, shown once |
| **Empty storage state** | root folder is empty | illustration + primary actions (upload / create folder); reuses `EmptyState` pattern |
| **First‑upload coachmarks** | until first upload completes | 1–2 lightweight hints (drag files here / use the + button); never modal‑blocking |
| **Feature hints** (optional) | first time a surface is seen | tiny tips for secure folders / `Shift Shift` / command palette — behind a flag |

## Components
`WelcomeDialog` (glass `glass-overlay`), `EmptyState` variants, `Coachmark` (small popover, dismissible),
optional `FeatureHint`. All keyboard‑dismissible, reduced‑motion aware.

## State / persistence
- "Seen onboarding" + "completed first upload" are **UI prefs** → local persistence (allowed, like theme). No backend.
- Gate the whole flow behind a **feature flag** ([feature-flags](../06-cross-cutting/feature-flags.md)) so it's easy to
  tune or disable.

## Endpoints
None new. Reads `Account/Profile` + `Cloud/User/StorageUsage` + the root listing to decide empty/first‑run state.

## Rules
- **Never block** the app — onboarding is dismissible and quiet (no forced multi‑step wizard).
- Respects reduced‑motion; coachmarks are `aria-live` polite and keyboard‑reachable
  ([accessibility](../06-cross-cutting/accessibility.md)).
- i18n‑keyed copy; shows once, never nags.

## States (matrix)
first‑run (welcome) · empty (guided) · returning (no onboarding) · post‑first‑upload (coachmarks retire).
