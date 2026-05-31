# Cross‑cutting — Observability (errors + product analytics)

> Know when the app breaks and how it's used — without leaking PII. ✅ **Frontend‑only** (third‑party SDKs; an optional
> backend log sink is future). Set up in [Phase 0](../01-roadmap/phases/phase-0-foundation.md), verified in
> [Phase 7](../01-roadmap/phases/phase-7-public-polish.md).

## 1. Error monitoring
- A client error reporter (Sentry‑style) captures unhandled errors, React error boundaries, and **typed `ApiError`s**
  from the [Instance](../02-architecture/data-layer.md) (with the error `code`/`httpStatus`, **never** request bodies or
  tokens).
- Source maps uploaded on build for readable stacks; release/version tagged.
- Route‑level `error.tsx` boundaries report + show the typed‑error UI.
- **Never report:** session ids, secure‑folder passphrases/tokens, file contents/names beyond what's needed, auth
  payloads. Scrub by default.

## 2. Product analytics (privacy‑first)
- Lightweight, **privacy‑respecting** event tracking for key funnels: sign‑in success, first upload, upload
  success/failure, preview opened, share used, secure‑folder unlocked (event only, **no secrets**), quota‑exceeded hit.
- **No PII** in event props; aggregate/anonymous where possible; honor Do‑Not‑Track and a user opt‑out.
- Events are **named via a small typed catalog** (no ad‑hoc strings) so the funnel stays analyzable.

## 3. Wiring
- Both behind **feature flags** + env keys ([feature-flags](./feature-flags.md)); **off in dev** by default.
- Initialized once in the app shell providers; integrated with the Query error path and the Instance error mapping.
- Respects the same i18n/no‑PII rules as the rest of the app.

## 4. What we measure success by (ties to MVP)
- Crash‑free sessions (error monitoring), first‑upload conversion + upload success rate (analytics) — the storage‑core
  health signals that matter most ([MVP-DEFINITION](../00-overview/MVP-DEFINITION.md)).

## 5. Acceptance
- A thrown error appears in the reporter with a readable stack and **no PII**.
- Opt‑out / DNT suppresses analytics. Dev builds don't send events.
- Token/passphrase/file data never leaves the client via telemetry (audited).
