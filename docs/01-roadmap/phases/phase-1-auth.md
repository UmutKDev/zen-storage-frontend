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

### 1.6 — Public legal pages
Privacy, Terms, Cookie, and Data‑Processing pages live under `app/(public)/` with placeholder copy. Legal review is
**post‑MVP**; the routes and consent plumbing must ship at MVP so analytics never load before consent.

**Steps:**
- [ ] Scaffold the four routes under `app/(public)/`:
      - `app/(public)/privacy/page.tsx`
      - `app/(public)/terms/page.tsx`
      - `app/(public)/cookies/page.tsx`
      - `app/(public)/data-processing/page.tsx`
- [ ] Wire copy through i18n keys from the `legal.*` namespace seeded in
      [Phase 0 task 0.4a](./phase-0-foundation.md). No hardcoded user‑facing strings.
- [ ] Mount the **Cookie Consent banner** in `app/providers.tsx`, backed by the Zustand `consent` store from 0.4a.
      Banner appears on first visit and persists the decision for **12 months**.
- [ ] Each page renders a "Last updated" date and a contact link.
- [ ] Analytics SDKs (and any non‑essential third‑party scripts) are **gated on consent** and must not load before the
      user accepts.

**Acceptance:**
- [ ] All four legal pages render at MVP with placeholder copy and a "Last updated" date.
- [ ] Cookie banner appears on first visit; decision persists 12 months across reloads.
- [ ] Analytics SDK does **not** load before consent is granted (verified via Network tab).

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
- [ ] **Login throttling (429 → `RATE_LIMIT` `ApiError`).** The login form disables submit and shows a countdown
      ("Retry in `{seconds}`s") on 429; the countdown reads from `Retry-After` and ticks every second.
      **Test:** 6 wrong‑password attempts on a single account; the 7th attempt renders the countdown UI with submit
      disabled.
- [ ] **WebAuthn HTTPS / localhost.** Passkey registration completes on `localhost` dev (browser secure‑context
      exception) **and** on HTTPS staging. **Test:** full registration ceremony at `http://localhost:3000` returns a
      credential and persists it server‑side.
- [ ] **Sign‑out teardown order.** `signOutAndCleanup()` executes — in this exact order — `socket.disconnect()` →
      `queryClient.cancelMutations()` + `queryClient.cancelQueries()` → `queryClient.clear()` → `store.reset()` on
      **all** Zustand stores → `Auth.js signOut()` → hard redirect to `/login`.
      **Test:** spy each step and assert call order; later steps never observe in‑flight requests or stale store state.
- [ ] **Multi‑step login state cookie.** If the custom cookie‑session fallback ([D‑A4](../../07-decisions/DECISIONS.md))
      is active, a short‑lived `__login_state` cookie (TTL **5 min**, `HttpOnly`, `Secure`, `SameSite=Lax`) carries
      the step state across navigations. **Test:** start login → reach the 2FA step → hard‑refresh the page; the user
      lands back on the 2FA step with no progress lost.

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
