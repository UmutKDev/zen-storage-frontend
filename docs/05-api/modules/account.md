# API — Account & Security

> Files: `src/modules/account/account.controller.ts`, `src/modules/account/security/security.controller.ts` (session auth).
> Back to [API index](../API-INVENTORY.md). Feature: [account](../../04-features/account.md).

## Account — `@Controller('Account')` → `/Api/Account/*`

| Method | Path | Request | Response | CASL |
|---|---|---|---|---|
| GET | `/Profile` | — | `AccountProfileResponseModel` | Read Account |
| PUT | `/Edit` | `AccountPutBodyRequestModel` | `boolean` | Update Account |
| PUT | `/ChangePassword` | `AccountChangePasswordRequestModel` | `boolean` | Update Account |
| POST | `/Upload/Image` | multipart (avatar) | **INACTIVE — not usable yet** | Update Account |

> **Avatar upload is INACTIVE** on the backend → **post‑MVP** ([Q7](../../07-decisions/open-questions.md),
> [backend-gaps](../../07-decisions/backend-gaps.md)). Ship a **read‑only** avatar; hide/disable the upload control until
> the endpoint is activated, then wire `useUploadAvatar` + re‑fetch profile.

## Account Security — `@Controller('Account/Security')` → `/Api/Account/Security/*` {#account-security}

| Group | Method | Path | Purpose |
|---|---|---|---|
| **Sessions** | GET | `/Sessions` | List active sessions (Account History) |
| | DELETE | `/Sessions/:sessionId` | Revoke one |
| | POST | `/Sessions/LogoutAll` | Revoke all |
| | POST | `/Sessions/LogoutOthers` | Revoke all except current |
| **Passkey** | POST | `/Passkey/Register/Begin` | WebAuthn registration challenge |
| | POST | `/Passkey/Register/Finish` | Complete registration |
| | GET | `/Passkey` | List passkeys |
| | DELETE | `/Passkey/:passkeyId` | Delete a passkey |
| **2FA (TOTP)** | POST | `/TwoFactor/TOTP/Setup` | Begin setup (QR/secret) |
| | POST | `/TwoFactor/TOTP/Verify` | Confirm + enable; returns backup codes |
| | POST | `/TwoFactor/TOTP/Disable` | Disable 2FA |
| | GET | `/TwoFactor/Status` | Is 2FA enabled |
| | POST | `/TwoFactor/BackupCodes/Regenerate` | New backup codes |
| **API Keys** | POST `/ApiKeys` · GET `/ApiKeys` · POST `/ApiKeys/:id` · DELETE `/ApiKeys/:id` · POST `/ApiKeys/:id/Rotate` | | Manage API keys/secrets (developer surface, post‑MVP) |

## Notes
- **Backup codes** are returned by `TwoFactor/TOTP/Verify` — show once + offer download.
- API‑keys screen is **scaffolded but post‑MVP**; the developer API it unlocks is in
  [api-module](./api-module.md).
- Passkey register reuses the same WebAuthn utilities as passkey **login**.
