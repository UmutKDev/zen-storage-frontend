# Phase 1 — Auth

> **Status:** ⏳ not started · **Depends on:** [Phase 0](./phase-0-foundation.md) · **Blocks:** Phase 2+.
> **Feature spec:** [auth](../../04-features/auth.md) · **Architecture:** [auth-integration](../../02-architecture/auth-integration.md)
> · **API:** [authentication](../../05-api/modules/authentication.md)

## Objective
Full **session‑based authentication**: Auth.js v5 credentials provider wrapping the backend's multi‑step flow, the
passkey path, register, password reset, sign‑out that fully clears client state, and route protection for the
authenticated area. No account‑management screens yet (Phase 2).

## Scope
**In:** register; multi‑step login (password → 2FA, plus passkey); password reset; session propagation
(`X-Session-Id`); `(app)` route protection + redirects; sign‑out side effects.
**Out:** profile/security management screens (Phase 2); team context UI.

## Task breakdown

### 1.1 — Auth.js v5 credentials provider (multi‑step)
- [ ] Provider wraps the flow: `Authentication/Login/Check` (returns available methods + whether 2FA is required) →
      `Authentication/Login` (password; sets session cookie; may return `RequiresTwoFactor`) →
      `Authentication/Verify2FA` (TOTP; **called with `X-Session-Id`** from the previous step).
- [ ] JWT stores `sessionId`, `expiresAt`, `requiresTwoFactor`. Session callback fetches `Account/Profile`.
      **No refresh token to the client.**
- [ ] Surface the right step state to the UI (email step → method step → password/2FA).

### 1.2 — Passkey login (bypasses 2FA)
- [ ] `Authentication/Passkey/Login/Begin` → WebAuthn ceremony (`@simplewebauthn/browser`) →
      `Authentication/Passkey/Login/Finish` → session. Handle unsupported browsers + user cancel.

### 1.3 — Register & reset
- [ ] Register screen (rhf + zod): `Authentication/Register` → session; handle email‑taken / weak password.
- [ ] Reset screen: `Authentication/ResetPassword`; neutral confirmation regardless of whether the email exists.

### 1.4 — Session propagation & protection
- [ ] `Instance` reads the session id and injects `X-Session-Id` (client + server paths).
- [ ] `(app)` route protection: unauthenticated → redirect to login (preserve intended path); authenticated on
      `(auth)` → redirect to app.
- [ ] Persist session across reloads; handle expiry → re‑auth.

### 1.5 — Sign‑out (full teardown)
- [ ] `Authentication/Logout` (server revoke) **and** clear: Query cache, Zustand stores, **all secure‑folder tokens**,
      team context, socket.

## Endpoints used
`Authentication/Login/Check`, `/Login`, `/Verify2FA`, `/Passkey/Login/Begin`, `/Passkey/Login/Finish`, `/Register`,
`/ResetPassword`, `/Logout`; `Account/Profile` (session hydrate). Full contracts:
[authentication](../../05-api/modules/authentication.md).

## Acceptance‑test checklist
- [ ] Password‑only login works; password+2FA login works (TOTP step uses the step‑2 session id).
- [ ] Passkey login works and **skips** the 2FA step; graceful fallback on unsupported/cancel.
- [ ] Register creates a session; duplicate email + weak password show correct errors.
- [ ] Reset shows a neutral confirmation; no account enumeration.
- [ ] Protected routes gate correctly; intended‑path redirect after login.
- [ ] Sign‑out revokes server‑side and clears **all** client state (cache, stores, tokens, socket).
- [ ] Rate‑limit (10/60s on auth endpoints) surfaces a clear, throttled UX.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Passkey/WebAuthn browser support | Feature‑detect; always offer password fallback. |
| 2FA step‑state correctness (session id handoff) | Encapsulate step state in the provider; test the handoff. |
| Auth.js v5 quirks on Next 16.2 | Validated in Phase 0; custom cookie‑session fallback ready. |
| Rate‑limit (10/60s) | Disable submit + countdown; explain to the user. |

## Rollback / fallback
If Auth.js v5 proves unstable, swap to the **custom cookie‑session adapter** spiked in Phase 0; the multi‑step flow and
screens stay the same — only the session plumbing changes.

## Exit criteria
A user can register, sign in by password (+2FA) or passkey, reset a password, stay signed in across reloads, and sign
out to a fully clean state; the app gates protected routes. Then begin [Phase 2](./phase-2-shell-account.md).
