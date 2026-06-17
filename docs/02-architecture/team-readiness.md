# Team‑Readiness — build for now, ship last

> Teams is the **last phase**, but the plumbing is laid from **Phase 0** so Phase 8 needs **zero refactor**.
> Phase: [phase-8](../01-roadmap/phases/phase-8-teams.md) · Glossary: [owner vs user](../00-overview/GLOSSARY.md#storage--ownership).

## 1. The principle
Everything that touches storage is **team‑parameterized from day one**, but **no team UI ships before Phase 8**. A
single switch (active workspace) flips the whole app between Personal and a team.

## 2. The three plumbing decisions made early

### a) Storage owner concept
The backend addresses storage by **owner** = `user.Id` (Personal) **or** `team/{TeamId}` (Team). The client mirrors this
as the query‑key **scope** and never assumes a plain user UUID. (The `ownerId` naming rule —
[CONVENTIONS](../00-overview/CONVENTIONS.md#the-ownerid-rule-carried-from-the-backend).)

### b) `X-Team-Id` injection
`stores/workspace.store.ts` (GLOBAL, wired from Phase 0) holds the active workspace; the [Instance](./data-layer.md) injects `X-Team-Id` on every backend call. The store's getter is registered via `service/token-sources.ts` -> `registerTeamSource(...)` from `app/providers.tsx`, so `service/interceptors/team.ts` reads it without importing from `features/` — the inverted-deps seam that keeps `service/` a leaf. In Personal, the header is absent. **No call sites change** when Teams turns on — only the store value.

### c) Team‑prefixed query keys
Every key is built via `lib/api/query-keys.ts` -> `scopedKey(scope, ...)` from **day one**, where `scope = 'personal' | teamId` ([state-management](./state-management.md)). A team switch invalidates cleanly with **zero refactor** — caches are cleanly separated with no manual purge logic and no Personal↔Team bleed.

## 3. What stays inert until Phase 8
- The **`WorkspaceSwitcher`** UI lives at `features/shell/components/WorkspaceSwitcher.tsx` (its slot is reserved by the shell in Phase 2 but shows Personal only; **activated in Phase 8**). Note: shell IS a feature — not `components/layout/`.
- `features/teams/index.ts` **exports NOTHING UI‑related before Phase 8**. `/check-conventions` enforces this by flagging references to `workspaceStore` outside `features/teams`.
- Team **CRUD / members / invitations** screens.
- **Permission‑denied** states for VIEWER (the [state-matrix](./state-matrix.md) row exists; it's exercised in Phase 8).

## 4. Why this avoids a refactor
Because headers, key scoping, and the owner concept are already in place, Phase 8 is **additive**: build the switch + the
team management screens + role gating, and reuse **all** existing storage surfaces under `X-Team-Id`. Nothing in
Phases 1–7 has to be rewritten.

## 5. Guardrails during MVP
- `stores/workspace.store.ts` exists from Phase 0 but is **Personal‑locked** until Phase 8.
- Don't add team‑only branches in feature code; rely on the `scopedKey` + `X-Team-Id` plumbing so features are context‑agnostic.
- Keep the VIEWER/permission‑denied state in mind when designing action affordances (disable‑able, explain‑able).
