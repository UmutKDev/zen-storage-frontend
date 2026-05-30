# Feature — Teams (Phase 8, LAST) ⚪

> Post‑MVP. Flips on the team layer; reuses all storage surfaces under `X-Team-Id`.
> Architecture: [team-readiness](../02-architecture/team-readiness.md) · API: [teams](../05-api/modules/teams.md).

## Workspace switch
**Component:** workspace switcher in the shell slot reserved in Phase 2.
**Behavior:** select Personal or a team → sets `X-Team-Id` + re‑prefixes query keys → clean cache separation.
**States:** Personal default; switching invalidates/segments cache (no Personal↔Team bleed).

## Team CRUD
**Endpoints:** `Team` POST/GET/`:Id`/PUT/DELETE. **States:** owner‑only delete; create/edit forms.

## Members
**Component:** members `table`.
**Endpoints:** `Team/Members` (list), `/:MemberId/Role` (PUT), `/:MemberId` (DELETE), `/Leave`, `/TransferOwnership`.
**Roles:** OWNER / ADMIN / MEMBER / VIEWER (CASL). Role change re‑gates the UI.

## Invitations
**Component:** invitations panel.
**Endpoints:** `Team/Invitations` (create/list), `/:Id` (cancel), `/Accept`, `/Decline`, `/Pending`.
**States:** pending badge; expiry.

## Team storage & permissions
- Reuse **all** storage surfaces under team context (every `Cloud/*` with `X-Team-Id`).
- **Permission‑denied** state for VIEWER: disabled actions + explanation (not raw 403 errors).
  See [state-matrix](../02-architecture/state-matrix.md).
- Team storage/quota display (same `Cloud/User/StorageUsage`, team‑scoped).

## Why it's a clean add
Headers, key scoping, and the owner concept were laid in Phase 0
([team-readiness](../02-architecture/team-readiness.md)) — this phase is additive UI + role gating, no refactor.
