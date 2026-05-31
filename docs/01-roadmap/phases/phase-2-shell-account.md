# Phase 2 — App Shell + Account (Personal)

> **Status:** ⏳ not started · **Depends on:** [Phase 1](./phase-1-auth.md) · **Blocks:** Phase 3+.
> **Feature spec:** [account](../../04-features/account.md) · **API:** [account](../../05-api/modules/account.md) ·
> [account-security](../../05-api/modules/account.md#account-security)

## Objective
The authenticated **shell** (navigation chrome the whole app lives in) plus the **Account** area: profile, security, and
a read‑only subscription view. **No team switch** — but the shell leaves the slot for it.

## Scope
**In:** app shell (sidebar/topbar, theme toggle, profile menu, notification bell with unread count); profile view/edit +
avatar; security (change password, 2FA setup/disable/backup codes, passkey management, session history); subscription
view (read‑only).
**Out:** team switcher UI (Phase 8); API‑keys management screen (post‑MVP, scaffold only); storage screens (Phase 3).

## Task breakdown

### 2.1 — App shell
- [ ] Sidebar + topbar layout in `(app)/layout`; responsive (collapsible sidebar / drawer on mobile).
- [ ] Theme toggle; profile menu (avatar, name, sign‑out).
- [ ] Notification **bell** with unread count (`Notification/UnreadCount`) — panel content arrives in Phase 6.
- [ ] Reserve the **workspace‑switch slot** in the shell (inert until Phase 8).

### 2.2 — Profile
- [ ] Profile view/edit form (rhf + zod): `Account/Profile` (read), `Account/Edit` (update). Optimistic edit + rollback.
- [ ] Avatar: **show** current avatar (read). **`Account/Upload/Image` is INACTIVE on the backend → upload deferred to
      post‑MVP**; hide/disable the upload action behind a flag (don't ship a dead button). When the backend activates it,
      wire `useUploadAvatar` + re‑fetch profile. See [backend-gaps](../../07-decisions/backend-gaps.md) /
      [Q7](../../07-decisions/open-questions.md).

### 2.3 — Security
- [ ] Change password: `Account/ChangePassword` (wrong‑current / mismatch handling).
- [ ] 2FA (TOTP): `…/TwoFactor/TOTP/Setup` → `Verify` → `Disable`, `…/Status`, `…/BackupCodes/Regenerate`;
      `qrcode.react`; **show/download backup codes once**.
- [ ] Passkeys: `…/Passkey/Register/Begin` → `Finish`, list (`GET /Passkey`), delete (`DELETE /Passkey/:id`).
- [ ] Sessions / history: `…/Sessions` list, revoke one (`DELETE /Sessions/:id`), `LogoutAll`, `LogoutOthers`
      (current vs others).

### 2.4 — Subscription view (read‑only)
- [ ] `Subscription/My` — show the current plan + limits; tie into the usage concept (no checkout in MVP).

### 2.5 — API keys (scaffold only, post‑MVP)
- [ ] Stub the `account/api-keys` route + nav entry behind a flag; full CRUD deferred.

## Endpoints used
`Account/Profile`, `/Edit`, `/ChangePassword`, `/Upload/Image`; `Account/Security/*` (Sessions, Passkey, TwoFactor,
ApiKeys); `Subscription/My`; `Notification/UnreadCount`. Contracts: [account](../../05-api/modules/account.md),
[subscription](../../05-api/modules/subscription.md), [notifications](../../05-api/modules/notifications.md).

## Acceptance‑test checklist
- [ ] Shell renders on desktop + mobile; theme toggle persists; profile menu signs out cleanly.
- [ ] Notification bell shows an accurate unread count.
- [ ] Profile edit saves (optimistic). Avatar **renders** (read); the upload control is hidden/disabled (endpoint
      inactive — deferred), not a broken button.
- [ ] Change password validates current/mismatch and succeeds.
- [ ] 2FA can be enabled (QR → verify), backup codes shown once + downloadable, and disabled.
- [ ] Passkeys can be registered, listed, and deleted.
- [ ] Sessions list shows current vs others; revoke one / others / all all work.
- [ ] Subscription view shows the current plan with no checkout affordance.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Backup‑codes "show once" UX | One‑time reveal + explicit download/confirm before dismiss. |
| WebAuthn ceremonies (register) | Reuse Phase‑1 passkey utilities; feature‑detect. |
| Avatar upload endpoint **inactive** | Defer upload (flagged off); ship read‑only avatar; activate when backend is ready. |

## Rollback / fallback
If `Account/Upload/Image` response is unusable, treat upload as fire‑and‑refetch. API‑keys screen stays stubbed without
affecting MVP.

## Exit criteria
A signed‑in user can manage their profile and all security settings and view their subscription inside a responsive,
themed shell — with the team‑switch slot present but inert. Then begin [Phase 3](./phase-3-storage-core.md).
