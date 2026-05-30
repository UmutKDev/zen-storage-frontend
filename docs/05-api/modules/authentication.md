# API — Authentication

> `@Controller('Authentication')` → `/Api/Authentication/*`. File: `src/modules/authentication/authentication.controller.ts`.
> Throttle **10/60s**; most endpoints `@Public`. Back to [API index](../API-INVENTORY.md). Feature: [auth](../../04-features/auth.md).

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/Login/Check` | `LoginCheckRequestModel` | `LoginCheckResponseModel` | **Step 1:** which auth methods + 2FA status for an email |
| POST | `/Login` | `LoginRequestModel` | `AuthenticationResponseModel` | **Step 2:** password; sets session cookie; may return `RequiresTwoFactor` |
| POST | `/Verify2FA` | `TwoFactorVerifyRequestModel` | `AuthenticationResponseModel` | **Step 3:** TOTP; call with `x-session-id` from step 2 |
| POST | `/Passkey/Login/Begin` | `PasskeyLoginBeginRequestModel` | `PasskeyLoginBeginResponseModel` | WebAuthn challenge |
| POST | `/Passkey/Login/Finish` | `PasskeyLoginFinishRequestModel` | `AuthenticationResponseModel` | **Bypasses 2FA** |
| POST | `/Register` | `RegisterRequestModel` | `AuthenticationResponseModel` | Creates user + session |
| POST | `/ResetPassword` | `ResetPasswordRequestModel` | `boolean` | Email‑based; respond neutrally (no enumeration) |
| POST | `/Logout` | — | `boolean` | Revokes session, clears cookie |

## Flow notes
- **Multi‑step:** `Login/Check` decides the path. Password → `Login` → (if `RequiresTwoFactor`) `Verify2FA` **with the
  session id from `Login`**. Passkey → `Begin`→`Finish`, **skipping** 2FA.
- The client wraps this in an Auth.js v5 credentials provider; JWT holds `sessionId/expiresAt/requiresTwoFactor`; the
  session callback hydrates from `Account/Profile`. See [auth-integration](../../02-architecture/auth-integration.md).

## Errors / edge
- Rate limit **10/60s** → throttled UX (disable + countdown).
- Wrong password / invalid TOTP / unknown email → typed errors (handled by the [Instance](../../02-architecture/data-layer.md)).
- Passkey unsupported/cancelled → fall back to password.
