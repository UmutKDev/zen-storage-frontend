# Cross‑cutting — Feature Flags

> Turn features on/off without a redeploy‑gated rewrite. ✅ **Frontend‑only** — **there is no backend flag module**
> ([backend-gaps](../07-decisions/backend-gaps.md)), so MVP flags are config/env/local. Set up in
> [Phase 0](../01-roadmap/phases/phase-0-foundation.md).

## 1. Why
- Stage **not‑yet‑ready** work safely (e.g. the favorites/recents interim, command palette, analytics).
- Hide **backend‑gated** features until their API exists ([backend-gaps](../07-decisions/backend-gaps.md)) without
  branching code everywhere.
- Allow quick disable if something regresses near a release.

## 2. Model (MVP — frontend)
- A typed flag registry (`lib/flags`) with a single `useFlag('name')` / `isEnabled('name')` API.
- Sources, in precedence: **env** (build‑time defaults) → **local override** (dev/QA toggles, persisted like a UI pref)
  → optional **remote config** later (no backend today).
- Flags are **typed** (no stringly‑typed checks scattered around); default **off** for unfinished work.

## 3. Initial flags
| Flag | Gates | Default |
|---|---|---|
| `quickAccess` | favorites/recents interim ([quick-access](../04-features/quick-access.md)) | off → on when ready |
| `commandPalette` | Cmd/Ctrl‑K palette ([keyboard-shortcuts](./keyboard-shortcuts.md)) | on (MVP) |
| `onboarding` | first‑run flow ([onboarding](../04-features/onboarding.md)) | on (MVP) |
| `analytics` | product analytics ([observability](./observability.md)) | off in dev, on in prod w/ opt‑out |
| `insightsGlobal` | account‑wide insights ([storage-insights](../04-features/storage-insights.md)) | off (needs API Q13) |
| `tags` | tags/labels ([tags](../04-features/tags.md)) | off (needs API Q12) |

## 4. Rules
- A flag gates **UI surface**, not data correctness — never ship a flag that, when on, fakes a missing backend.
- Remove a flag once its feature is permanently shipped (don't accumulate dead flags).
- Flags are documented here; adding one updates this table.

## 5. Acceptance
- Toggling a flag shows/hides its surface with no errors; backend‑gated flags stay off until their API exists; no flag,
  when on, fabricates server data.
