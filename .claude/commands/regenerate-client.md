---
description: Regenerate the OpenAPI client into service/generates and wire any new factories
argument-hint: (none)
allowed-tools: Read, Grep, Glob, Edit, Bash(bun run generate:service:test), Bash(bunx tsc --noEmit), Bash(git status:*), Bash(git diff:*)
---

Regenerate the typed API client from the backend's OpenAPI spec.

## Pre-flight
- The spec must be reachable at `http://localhost:8080/swagger-json` (config in `openapitools.json`,
  generator `typescript-axios` 7.17.0 → `service/generates`). If unreachable, stop and tell the user to start the API.
- Read `docs/02-architecture/data-layer.md` for the workflow rules.

## Run
1. `bun run generate:service:test`.
2. `bunx tsc --noEmit` to confirm the new client type‑checks.
3. `git diff --stat service/generates` to review the change surface.

## After regeneration
- If new API factories appeared, wire them in `service/factories.ts` on the shared `Instance` (mirror the existing
  pattern). Likely candidates noted in the docs: **Subscription**, **Notification**.
- Update any hook/DTO usage broken by contract changes (fix at the call site, never inside `service/generates`).
- Commit the regenerated client on its own: `chore(api): regenerate client`.

## Do NOT
- **Never hand‑edit `service/generates/*`** — it is build output. If a type is wrong, fix the spec/generation upstream.
- Don't introduce a hand‑rolled DTO to "patch" a generation gap — raise it as an open question instead.
