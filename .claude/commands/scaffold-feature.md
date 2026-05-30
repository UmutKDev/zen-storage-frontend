---
description: Scaffold a feature folder (components + hooks + local store) following v2 conventions
argument-hint: <feature-name e.g. storage, preview, account>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(bunx tsc --noEmit), Bash(bun run lint), Bash(ls:*)
---

Scaffold the `features/$ARGUMENTS/` area following project conventions. This delegates to the **`scaffold-feature`
skill** for the question flow and the exact file shapes.

## Pre-flight
1. If `$ARGUMENTS` is empty, ask for the feature name (kebab, matches a `docs/04-features/*` area where possible).
2. `ls features/` — if it already exists, ask whether to extend it instead of regenerating.

## Read before writing
- `.claude/skills/scaffold-feature/SKILL.md` — the question flow + file templates.
- `docs/02-architecture/ARCHITECTURE.md#folder-structure` + `docs/00-overview/CONVENTIONS.md` (data access, query keys).
- The matching `docs/04-features/$ARGUMENTS*.md` spec (screens, components, endpoints, states) if one exists.

## Generate (per the skill)
- `features/$ARGUMENTS/components/` (UI from wrapped primitives/patterns),
- `features/$ARGUMENTS/hooks/` (typed hooks wrapping **factories** on `Instance`, team‑prefixed query keys),
- `features/$ARGUMENTS/<name>.store.ts` only if UI/transient state is needed (Zustand),
- no hand‑rolled DTOs (use generated models), all copy via i18n keys.

## Post-generation
1. `bunx tsc --noEmit` + `bun run lint` (focus on the new files).
2. Run **`data-layer-reviewer`** + **`design-system-reviewer`** on the new files.
3. Remind: wire any new route under `app/(app)/…`; add i18n keys; map endpoints to `docs/05-api`.

## Do NOT
Add team UI (pre‑Phase 8), persist secure‑folder tokens, or introduce a parallel data/state system.
