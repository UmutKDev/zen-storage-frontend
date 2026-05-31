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

## 7. Custom cookie‑session fallback (D‑A4 alternative)

> Triggered **only** if the Phase 0 task 0.0 Auth.js v5 / Next 16.2 spike fails. This is a **1‑day refactor, not a
> full rewrite** — the multi‑step flow, all screens, and the Instance header contract from §3 are unchanged. Locked in
> [DECISIONS](../07-decisions/DECISIONS.md) as **D‑A4** (fallback only).

### 7.1 File layout

```
lib/auth/
  cookie-session.ts          HMAC-SHA256 signed cookie; HttpOnly, Secure, SameSite=Strict, 7-day TTL;
                             refreshed on every authenticated request.
  proxy.ts                   Next 16.2 proxy: reads cookie → POST /Authentication/Validate →
                             redirects /auth/login on 401 → attaches session to the request.
  server.ts                  import "server-only"; exports getSession(): {user, sessionId} | null for RSC.
  client.ts                  "use client" Context provider; hydrated from a server-rendered initial
                             prop in app/providers.tsx.

app/api/auth/[...session]/route.ts
                             Route handlers: /login, /logout, /refresh, /me — proxy to backend.
```

### 7.2 Backend contract (no change required)

| Endpoint | Returns | Purpose |
|---|---|---|
| `POST /Authentication/Login` | `{ SessionId, ExpiresAt, User }` | Issue session + cookie. |
| `POST /Authentication/Validate` | `200` or `401` | Proxy gate per request. |
| `POST /Authentication/Logout` | — | Server‑side invalidation. |
| `POST /Authentication/Refresh` | `{ SessionId, ExpiresAt }` | Cookie + CSRF rotation. |

### 7.3 CSRF

- **Non‑GET routes require `X-CSRF-Token`** matching a same‑origin cookie (double‑submit pattern).
- Token is **issued at login** and **rotated on refresh**.
- A new **Instance request interceptor** (`service/interceptors/csrf.ts`) attaches the header on every non‑GET — this
  interceptor stays in place even if we later migrate back to Auth.js v5.

### 7.4 Multi‑step login state

- Step state lives in a second short‑lived cookie **`__login_state`** — signed, **5‑minute TTL**.
- Client routes the user through `/auth/login` → `/auth/login/password` → `/auth/login/2fa`. Each step **reads and
  writes** the step cookie; the final step exchanges it for the long‑lived session cookie.
- The 2FA handoff from §6 still applies — the session id from `Login` is what the verify call carries.

### 7.5 Migration back to Auth.js v5

When Auth.js v5 stabilises (out of beta) **and** ships first‑class Next 16.2 Proxy support, a **post‑MVP migration**
replaces `lib/auth/{cookie-session,proxy,server,client}.ts` and `app/api/auth/[...session]/route.ts`. The CSRF
interceptor (`service/interceptors/csrf.ts`) stays either way.
