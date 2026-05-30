# Phase 8 — Teams Integration (LAST, post‑MVP)

> **Status:** ⏳ not started · **Depends on:** Phases 0–7 (and the team‑readiness laid in Phase 0).
> **Feature spec:** [teams](../../04-features/teams.md) · **Architecture:** [team-readiness](../../02-architecture/team-readiness.md)
> · **API:** [teams](../../05-api/modules/teams.md)

## Objective
**Flip on the team layer with zero refactor.** Because Phase 0 made all data fetching team‑parameterized (query‑key
prefixes + `X-Team-Id` injection) and respected the storage‑owner concept, Teams is mostly UI + the switch.

## Scope
**In:** workspace store + Personal↔Team switch; end‑to‑end `X-Team-Id` wiring; team CRUD; members (roles); invitations
(accept/decline/pending); team storage/quota; permission‑denied states (CASL roles).
**Out:** nothing new architecturally — this is the deferred UI + role gating.

## Task breakdown

### 8.1 — Workspace switch
- [ ] `workspace.store` switcher (Personal ↔ Team) in the shell slot reserved in Phase 2.
- [ ] Setting the active team injects `X-Team-Id` and **re‑prefixes query keys** → clean cache separation.
- [ ] Switching context invalidates/segments cache correctly (no Personal↔Team bleed).

### 8.2 — Team CRUD
- [ ] Create/read/update/delete teams (`Team` POST/GET/:Id/PUT/DELETE); owner‑only delete.

### 8.3 — Members
- [ ] Members table; role change (`Team/Members/:MemberId/Role`); remove; leave; transfer ownership.
- [ ] Roles: OWNER / ADMIN / MEMBER / VIEWER (CASL `Team*`).

### 8.4 — Invitations
- [ ] Create/list/cancel; accept/decline; pending (`Team/Invitations*`); pending badge; expiry.

### 8.5 — Team storage & permissions
- [ ] Reuse **all** storage surfaces under team context (every `Cloud/*` with `X-Team-Id`).
- [ ] **Permission‑denied** state for VIEWER (disabled actions + explanation) — see
      [state-matrix](../../02-architecture/state-matrix.md).
- [ ] Team storage/quota display.

## Endpoints used
`Team/*`, `Team/Members/*`, `Team/Invitations/*`, and **all** `Cloud/*` under `X-Team-Id`.
Contracts: [teams](../../05-api/modules/teams.md).

## Acceptance‑test checklist
- [ ] Switch Personal↔Team; the entire storage experience works under team context.
- [ ] Cache is cleanly segmented on switch (no Personal data shown in Team and vice‑versa).
- [ ] Team CRUD works; only owners can delete.
- [ ] Member role changes, removal, leave, and ownership transfer work and re‑gate the UI.
- [ ] Invitations: create/list/cancel/accept/decline/pending all work; pending badge accurate.
- [ ] VIEWER sees permission‑denied (disabled actions + explanation), not raw errors.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Query‑key/cache invalidation on switch | Team‑prefixed keys from Phase 0; explicit invalidation on switch; tests. |
| Permission‑matrix completeness | Map every action to a CASL role expectation; cover VIEWER explicitly. |

## Rollback / fallback
Because the layer is additive and gated by the switch, Teams can be feature‑flagged off without touching the Personal
MVP.

## Exit criteria
A user can switch to a team and do everything Personal allows (subject to role), with clean cache separation and proper
permission states. **The product is now Personal + Teams complete.**
