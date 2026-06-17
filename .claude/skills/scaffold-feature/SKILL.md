---
name: scaffold-feature
description: Scaffold a feature folder for the nextjs-storage v2 frontend (components + typed hooks on generated factories + optional Zustand store) following project conventions. Use when creating a new feature area under features/ (storage, preview, account, etc.) or when the user says scaffold/bootstrap a feature.
---

# Scaffold Feature Skill

Generates a complete, convention‑following feature area under `features/<name>/`. Grounded in the project docs — never
generic React structure.

## Read first
- `docs/02-architecture/ARCHITECTURE.md#folder-structure` — where things go
- `docs/00-overview/CONVENTIONS.md` — data access (§2), query keys (§3), i18n, a11y
- `docs/02-architecture/data-layer.md` + `docs/02-architecture/state-management.md`
- The matching `docs/04-features/<name>*.md` spec, if one exists (screens, components, endpoints, states)

## Ask before generating
1. **Feature name** (kebab; matches a `docs/04-features/*` area where possible).
2. **Screens/surfaces** it owns (from the feature spec).
3. **Endpoints** it calls → which generated **factory** (`service/factories.ts`).
4. **UI/transient state?** → does it need a Zustand store (selection, dialog, queue)? If it's only server data, **no
   store** — use TanStack Query.
5. **Realtime?** → does it consume socket events / long jobs (then a job store + polling fallback, not a query)?

## What gets generated
```
features/<name>/
  components/            UI built from components/ui/* (wrapped shadcn) + named patterns
  hooks/
    use<Name>.ts         typed hook(s) wrapping a FACTORY on Instance; team-prefixed query keys
  <name>.store.ts        ONLY if UI/transient state is needed (Zustand)
  index.ts               barrel exports
```

### Hook shape (the important part)
- Calls go through a **generated factory** (`cloudApiFactory`, `accountApiFactory`, …) on the shared `Instance` —
  **never** raw `fetch`/`axios`.
- Types are **generated models** from `service/generates` — **never** hand‑rolled.
- Query keys: arrays, namespaced, **team‑prefixed** (`['personal'|teamId, '<area>', ...]`); fold secure‑folder tokens
  into keys for affected surfaces.
- Mutations: optimistic + rollback where it matters; targeted invalidation; no auto‑retry; `403`/`409` routed to the
  unlock prompt / conflict dialog.

### Component shape
- Use wrapped primitives (`components/ui/*`) and named patterns; semantic tokens; motion via `lib/motion`; all copy via
  i18n keys; cover the surface's **state‑matrix** states (`docs/02-architecture/state-matrix.md`).

## Post-generation checklist (output to the user)
```
1. Wire routes under app/(app)/… (or the right group) if this feature has screens.
2. Add i18n keys for all new copy (area.screen.element).
3. Confirm endpoints + DTOs against docs/05-api/modules/*.
4. Run: bunx tsc --noEmit  &&  bun run lint
5. Review: data-layer-reviewer + design-system-reviewer (+ a11y-state-reviewer for UI-heavy areas).
6. Do NOT add team UI before Phase 8; do NOT persist secure-folder tokens.
```

## Patterns applied to every file
- Factory + `Instance` for all backend calls; generated models only; PascalCase DTO fields.
- TanStack Query for server state, Zustand only for UI/transient; one shared `Instance`.
- Semantic tokens, `lib/motion` variants + reduced‑motion, i18n keys, keyboard/focus a11y.
