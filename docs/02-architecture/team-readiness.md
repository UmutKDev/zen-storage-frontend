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
The [Instance](./data-layer.md) reads the active team from `workspace.store` and injects `X-Team-Id` on every backend
call. In Personal, it's absent. **No call sites change** when Teams turns on — only the store value.

### c) Team‑prefixed query keys
Every key starts with `scope = 'personal' | teamId` ([state-management](./state-management.md)). Switching context
re‑scopes keys, so caches are cleanly separated with no manual purge logic and no Personal↔Team bleed.

## 3. What stays inert until Phase 8
- The **workspace switcher** UI (its slot is reserved in the shell in Phase 2, but it shows Personal only).
- Team **CRUD / members / invitations** screens.
- **Permission‑denied** states for VIEWER (the [state-matrix](./state-matrix.md) row exists; it's exercised in Phase 8).

## 4. Why this avoids a refactor
Because headers, key scoping, and the owner concept are already in place, Phase 8 is **additive**: build the switch + the
team management screens + role gating, and reuse **all** existing storage surfaces under `X-Team-Id`. Nothing in
Phases 1–7 has to be rewritten.

## 5. Guardrails during MVP
- `workspace.store` exists but is **Personal‑locked** until Phase 8.
- Don't add team‑only branches in feature code; rely on the scope/header plumbing so features are context‑agnostic.
- Keep the VIEWER/permission‑denied state in mind when designing action affordances (disable‑able, explain‑able).
