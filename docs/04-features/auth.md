# Feature — Auth (Phase 1) 🟢

> Register, multi‑step login (password + 2FA + passkey), reset, logout.
> Architecture: [auth-integration](../02-architecture/auth-integration.md) · API: [authentication](../05-api/modules/authentication.md).

## Screens

### Login — `(auth)/login` (multi‑step)
**Layout:** centered `container-sm` card; step transitions use the `pageTransition`/`modal` motion.

```
Step 1 — Email          [email] → Continue            (Login/Check)
Step 2 — Method         shows available methods + whether 2FA is required
Step 3a — Password      [password] → Sign in          (Login)  → if RequiresTwoFactor → 3c
Step 3b — Passkey       "Use passkey" → WebAuthn       (Passkey/Login/Begin→Finish)  (BYPASSES 2FA)
Step 3c — 2FA           [6-digit TOTP] → Verify        (Verify2FA, with X-Session-Id)
            ↳ "Use a backup code" alternative
```

**Components:** `form` (rhf+zod), `input`, `button`, step container (motion), passkey button, OTP input.
**Endpoints:** `Authentication/Login/Check` → `/Login` → `/Verify2FA`; `Passkey/Login/Begin`→`/Finish`.
**States / edge cases:** unknown email; wrong password; `RequiresTwoFactor`; invalid TOTP; backup‑code path; passkey
cancel/unsupported (fall back to password); **rate‑limit 10/60s** (disable + countdown); network error.
**Keyboard/a11y:** Enter advances each step; OTP autofocus + paste; focus moves to the new step; errors via `aria-live`.

### Register — `(auth)/register`
**Endpoints:** `Authentication/Register` → session. **States:** email taken; weak password (zod rules); success → app.

### Reset — `(auth)/reset`
**Endpoints:** `Authentication/ResetPassword`. **States:** **neutral confirmation** regardless of whether the email
exists (no account enumeration); sent state.

### Logout — shell menu
**Endpoints:** `Authentication/Logout`. **Effect:** full teardown — clears session, Query cache, stores, **all
secure‑folder tokens**, team context, socket. See [auth-integration §4](../02-architecture/auth-integration.md#4-sign-out-full-teardown).

## Decisions / notes
- Auth.js v5 credentials wrap the flow; fallback = custom cookie‑session ([D‑A4](../07-decisions/DECISIONS.md)).
- No refresh token to the client; session id only.
