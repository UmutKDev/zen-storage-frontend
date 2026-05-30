---
description: Run the full convention sweep (data-layer + design-system + a11y/state) over the current diff
argument-hint: (none — reviews the working changes)
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git diff:*), Bash(bun run lint), Bash(bunx tsc --noEmit)
---

Run a full convention review over the **current uncommitted changes** before committing.

## Steps
1. `git status` + `git diff` to scope what changed.
2. `bunx tsc --noEmit` and `bun run lint` — fix obvious issues first.
3. Dispatch the three narrow reviewers on the touched files:
   - **`data-layer-reviewer`** — factories/Instance only, generated models, PascalCase, ownerId, idempotency, envelope.
   - **`design-system-reviewer`** — semantic tokens (no raw hex), motion + reduced‑motion, shadcn‑via‑MCP, focus.
   - **`a11y-state-reviewer`** — keyboard/focus/aria‑live, state‑matrix coverage, TanStack vs Zustand split.
4. Collate findings by severity (CRITICAL → WARN → NIT) with `file:line` + fix.

## Reference (the rules being enforced)
`CLAUDE.md` critical rules · `docs/00-overview/CONVENTIONS.md` · `docs/02-architecture/*` · `docs/03-design-system/*` ·
`docs/02-architecture/state-matrix.md`.

## Output
A single consolidated report. If everything is clean, say so explicitly per reviewer. Do not auto‑fix CRITICAL items
without surfacing them first; propose fixes and let the user confirm scope.
