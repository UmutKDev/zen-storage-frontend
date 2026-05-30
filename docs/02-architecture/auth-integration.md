# Auth Integration — Auth.js v5, session‑id model

> Session‑based auth with **no refresh token exposed to the client**. Mirrors the old frontend's multi‑step flow.
> Feature spec: [auth](../04-features/auth.md) · API: [authentication](../05-api/modules/authentication.md).

## 1. Model

- The credential is a **session id**, carried via cookie `SESSION_COOKIE_NAME`, header **`X-Session-Id`**, or
  `Authorization: Bearer`. **7‑day TTL** on the backend.
- The client **never** sees a refresh token. Re‑auth happens by signing in again.
- The v2 scaffold's default README mentions refresh‑token/localStorage flows — **ignore it**; it does not apply.

## 2. The multi‑step flow (credentials provider)

```
Login/Check(email)                    → which methods + RequiresTwoFactor?
   ├─ password path:
   │     Login(email,password)        → session; may return RequiresTwoFactor
   │        └─ Verify2FA(totp)        → called WITH X-Session-Id from Login; completes session
   └─ passkey path:
         Passkey/Login/Begin          → WebAuthn challenge
            └─ Passkey/Login/Finish   → session  (BYPASSES 2FA)
```

- Auth.js **credentials provider** wraps this. The JWT stores `sessionId`, `expiresAt`, `requiresTwoFactor`.
- The **session callback** fetches `Account/Profile` so the app has user info.
- Register (`Register`) and reset (`ResetPassword`) are separate screens; register yields a session.

## 3. Propagation

- The [Instance](./data-layer.md) injects `X-Session-Id` on every backend call (client from the Auth.js session; server
  from the server token).
- `(app)` routes are protected; unauthenticated → `/login` (intended path preserved). Authenticated on `(auth)` →
  redirect into the app.

## 4. Sign‑out (full teardown)

`signOut` must:
1. Call `Authentication/Logout` (server revoke).
2. Clear the **Query cache** and **all Zustand stores**.
3. Clear **all secure‑folder tokens** ([secure-folder-lifecycle](./secure-folder-lifecycle.md)).
4. Clear **team context** ([team-readiness](./team-readiness.md)).
5. Tear down the **socket** ([realtime-socket](./realtime-socket.md)).

## 5. Risk & fallback

- **Top risk:** Auth.js v5 compatibility with Next 16.2 / React 19. **Validate in Phase 0.**
- **Fallback:** a thin **custom cookie‑session adapter** (spiked in Phase 0). The multi‑step flow and all screens stay
  the same — only the session plumbing changes. Recorded in [DECISIONS](../07-decisions/DECISIONS.md) (D‑A4).

## 6. Edge cases
- 2FA step uses the **session id from the `Login` step** — get the handoff right.
- Passkey unsupported/cancelled → fall back to password.
- Rate limit (10/60s on auth endpoints) → disable submit + countdown.
- Session expiry mid‑use → `401` from the Instance → re‑auth.
