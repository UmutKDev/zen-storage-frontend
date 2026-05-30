# Feature — Account & Security (Phase 2) 🟢

> Profile, security (password, 2FA, passkeys, sessions), subscription view, inside the authenticated shell.
> API: [account](../05-api/modules/account.md), [subscription](../05-api/modules/subscription.md).

## App shell (hosts everything in `(app)`)
**Layout:** topbar (search · usage bar · notification bell · profile menu) + sidebar (nav · workspace‑switch slot, inert).
**Components:** shell, `UsageBar`, notification bell (`NotificationInbox` content in Phase 6), theme toggle, profile menu.
**Endpoints:** `Account/Profile`, `Notification/UnreadCount`. **States:** responsive (sidebar→drawer on mobile).

## Profile — `account/profile`
**Layout:** `container-md` form + avatar.
**Components:** `form` (rhf+zod), avatar uploader.
**Endpoints:** `Account/Profile` (read), `Account/Edit` (update), `Account/Upload/Image` (avatar).
**States/edge:** optimistic edit + rollback; avatar upload error; validation; **re‑fetch profile after avatar upload**
(response shape `UNVERIFIED` — [open Q7](../07-decisions/open-questions.md)).

## Security — `account/security` (tabbed/sectioned)
| Section | Components | Endpoints | States / edge cases |
|---|---|---|---|
| Change password | `form` | `Account/ChangePassword` | wrong current; mismatch; success toast |
| 2FA (TOTP) | QR (`qrcode.react`), OTP input | `…/TwoFactor/TOTP/Setup`→`Verify`→`Disable`, `…/Status`, `…/BackupCodes/Regenerate` | enable flow; **backup codes shown once** + downloadable; disable confirm |
| Passkeys | list + register button | `…/Passkey/Register/Begin`→`Finish`, `GET /Passkey`, `DELETE /Passkey/:id` | unsupported browser; duplicate; delete confirm |
| Sessions / history | `table` | `…/Sessions`, `DELETE /Sessions/:id`, `/LogoutAll`, `/LogoutOthers` | current vs others; revoke confirm |
| API keys ⚪ | stub | `…/ApiKeys*` | scaffold only, post‑MVP (flagged) |

**a11y:** each section keyboard‑navigable; confirmations are `alert-dialog`; OTP/secret fields handle paste.

## Subscription view — `account/subscription` 🟡
**Components:** plan card.
**Endpoints:** `Subscription/My`.
**States:** none/active; show plan limits; ties into usage; **no checkout in MVP**.

## Notes
- All security flows reuse the Phase‑1 WebAuthn utilities.
- The notification bell shows an unread count here; the inbox panel content ships in [Phase 6](../04-features/advanced.md).
