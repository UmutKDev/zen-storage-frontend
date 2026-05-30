# API — Teams (LAST phase)

> `/Api/Team`, `/Api/Team/Members`, `/Api/Team/Invitations`. Files: `team.controller.ts`, `team-member.controller.ts`,
> `team-invitation.controller.ts` · most require `x-team-id`. Back to [API index](../API-INVENTORY.md). Feature:
> [teams](../../04-features/teams.md) · Readiness: [team-readiness](../../02-architecture/team-readiness.md).

| Area | Endpoints |
|---|---|
| **Team** | POST `/Team` · GET `/Team` · GET `/Team/:Id` · PUT `/Team/:Id` · DELETE `/Team/:Id` |
| **Members** | GET `/Team/Members` · PUT `/Team/Members/:MemberId/Role` · DELETE `/Team/Members/:MemberId` · POST `/Team/Members/Leave` · POST `/Team/Members/TransferOwnership` |
| **Invitations** | POST `/Team/Invitations` · GET `/Team/Invitations` · DELETE `/Team/Invitations/:Id` · POST `/Team/Invitations/Accept` · POST `/Team/Invitations/Decline` · GET `/Team/Invitations/Pending` |

- **Roles:** OWNER / ADMIN / MEMBER / VIEWER (CASL `Team*` subjects).
- All storage works under team context by sending **`x-team-id`** on every `Cloud/*` call — the
  [Instance](../../02-architecture/data-layer.md) injects it from `workspace.store`.

## Client notes
- **MVP sends no `x-team-id`** (Personal). Phase 8 turns on the switch; **no call sites change** thanks to
  [team-readiness](../../02-architecture/team-readiness.md).
- VIEWER → CASL `403` → **permission‑denied** state (disabled actions + explanation), not a raw error.
