---
description: Begin implementing a roadmap phase using its detailed checklist in docs/01-roadmap/phases
argument-hint: <phase number 0-8>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(bun install), Bash(bun run dev), Bash(bun run build), Bash(bun run lint), Bash(bun run generate:service:test), Bash(bunx tsc --noEmit), Bash(git status:*), Bash(git diff:*)
---

Implement **Phase $ARGUMENTS** of the v2 frontend.

## Pre-flight
1. If `$ARGUMENTS` is empty or not 0–8, ask which phase. Confirm the **previous** phase is ✅ in
   `docs/01-roadmap/STATUS.md` (or the user explicitly approves parallel work). Don't pull later‑phase scope forward.
2. **If Phase 0 or the task touches Next internals (routing, RSC, metadata, caching): read
   `node_modules/next/dist/docs/01-app/` first.** This Next version has breaking changes.

## Authoritative context — read before writing
- `docs/01-roadmap/phases/phase-$ARGUMENTS-*.md` — **the checklist of record** (objective, scope, tasks, acceptance
  tests, risks, exit criteria).
- `CLAUDE.md` + `docs/00-overview/CONVENTIONS.md` — rules; don't re-derive.
- For each task, follow its links: the `docs/04-features/*` spec, the `docs/02-architecture/*` concern, the
  `docs/03-design-system/*` design, and the `docs/05-api/modules/*` contract.

## Execute
1. Work the phase's task list top to bottom. Tick `- [ ]` → `- [x]` in the phase file as you complete each.
2. Obey the critical rules: generated **factory + `Instance`** for all calls, generated **models** only, PascalCase DTO
   props, team‑prefixed query keys, i18n keys, semantic tokens, motion via `lib/motion` + reduced‑motion, secure‑folder
   tokens never persisted.
3. After each meaningful chunk: `bunx tsc --noEmit` and `bun run lint`.

## Review (before declaring the phase done)
- Run **`data-layer-reviewer`** and **`design-system-reviewer`**; for UI‑heavy phases also **`a11y-state-reviewer`**.
- Verify the phase's **acceptance‑test checklist** passes item by item.

## Close
- Mark the phase ✅ in `docs/01-roadmap/STATUS.md`; add a dated line to the ROADMAP changelog.
- If a decision was made, log it in `docs/07-decisions/DECISIONS.md`; new questions → `open-questions.md`.

## Do NOT
- Hand‑edit `service/generates/*`. Build team UI before Phase 8. Persist secure‑folder tokens. Run destructive
  DB/backend commands or `git push --force`/push to `main`.
