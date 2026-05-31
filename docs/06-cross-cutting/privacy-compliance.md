# Cross‑cutting — Privacy & Compliance (KVKK + GDPR)

> Dual‑regime by design: **KVKK** (Türkiye, Law 6698) and **GDPR** (EU, 2016/679). Both regimes treat the user as a data
> subject with overlapping rights; we implement to the **stricter union**. Foundations land in
> [Phase 0](../01-roadmap/phases/phase-0-foundation.md), surfaces (consent, public pages) land in
> [Phase 1](../01-roadmap/phases/phase-1-shell-auth.md) and [Phase 7](../01-roadmap/phases/phase-7-public-polish.md);
> DSR flows in [Phase 2](../01-roadmap/phases/phase-2-storage-core.md) account UX.

## 1. Scope & legal basis

| Regime | Applies to | Legal basis we rely on |
|---|---|---|
| **KVKK** (TR) | TR data subjects | Explicit consent (`açık rıza`) for analytics/marketing; contract performance for storage; legitimate interest for security/anti‑abuse. |
| **GDPR** (EU/EEA + UK GDPR mirror) | EU/EEA data subjects | Art. 6(1)(b) contract for core storage; 6(1)(a) consent for analytics/marketing; 6(1)(f) legitimate interest for security/fraud prevention. |

Data controller: the SaaS operator. The frontend's job is to (a) make consent meaningful, (b) avoid leaking PII into
telemetry/logs, (c) expose data‑subject‑rights (DSR) UX, (d) surface incident state when required.

## 2. PII inventory (frontend‑visible)

| Category | Fields | Source | Storage in client | Sent to telemetry? |
|---|---|---|---|---|
| Identity | `Id`, `Email`, `DisplayName`, `AvatarUrl` | `/auth/me` | TanStack Query cache (memory) | **No** (user id hash only) |
| Auth artifacts | refresh token, session id, WebAuthn credential id | HttpOnly cookie + browser credential store | Not readable by JS | **Never** |
| Storage objects | `Path`, `Name`, `Size`, `MimeType`, presigned URLs | `/storage/*` factories | Query cache | **Never** (paths/names are PII‑adjacent) |
| Secure‑folder tokens | passphrase‑derived token | none — **in‑memory only** | RAM, cleared on logout/tab close | **Never** (see [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md)) |
| Team context | `TeamId`, member emails | `/teams/*` | Query cache | id only |
| Device/network | UA, IP (server‑observed only) | browser/headers | n/a | UA bucket only; IP truncated server‑side |
| Billing | plan, status, last 4 of card | `/subscription/*` | Query cache | **Never** |

Rule: anything that could identify a person or their files **does not** appear in Sentry events, analytics payloads, or
URL query strings.

## 3. Consent matrix

Three tiers; consent is **per‑category**, withdrawable, and re‑promptable on policy change. Default state for non‑essential is **off** (GDPR; KVKK opt‑in).

| Category | Examples | Default | Blocks if denied |
|---|---|---|---|
| **Essential** | Session cookie, CSRF, auth refresh, locale | On (no consent needed — Art. 6(1)(b)/(f); KVKK contract) | App cannot run without it |
| **Functional** | Theme, view prefs, recent folders, UI hints | Off until accepted | Cosmetic prefs reset per session |
| **Analytics** | Product analytics events, error monitoring with PII scrubbed | Off until accepted | No event capture; error monitoring may still run with strict scrubbing if classified essential‑for‑security (decision: keep gated; see Open items) |

Consent record kept client‑side (versioned) and mirrored to backend when authenticated. A banner appears on first
visit and on policy‑version bump. A persistent "Cookie preferences" link in the footer reopens the modal.

```ts
// shape (local + synced)
type ConsentRecord = {
  Version: string;         // matches /privacy hash
  Essential: true;         // always
  Functional: boolean;
  Analytics: boolean;
  DecidedAt: string;       // ISO
  Locale: 'en' | 'tr';
};
```

## 4. Public pages

All four are statically rendered, versioned, and linked from the footer + signup flow. Markdown source lives under
`content/legal/{en,tr}/`; the rendered page exposes a "Last updated" date and a content hash that ties to
`ConsentRecord.Version`.

| Route | Purpose | Notes |
|---|---|---|
| `/privacy` | Privacy notice (controller, purposes, basis, retention, rights, contact, DPO if applicable) | KVKK Aydınlatma Metni + GDPR Art. 13/14 |
| `/terms` | Terms of service | References `/privacy`, `/cookies` |
| `/cookies` | Cookie/local‑storage inventory + consent controls reopener | Lists each cookie with purpose, lifetime, category |
| `/data-processing` | Sub‑processors list + DPA contact + international transfer notes (SCCs / KVKK Art. 9) | Updated on sub‑processor change with notice |

## 5. Data‑subject rights (DSR) UX

Implemented in account settings ([features/account](../04-features/FEATURE-MAP.md)). Each action calls a typed factory;
the user gets a status receipt with a request id.

| Right | Article | UX |
|---|---|---|
| Access | GDPR Art. 15 / KVKK Art. 11 | Account → Privacy → "Download my data" → async job → email with signed link |
| Erasure | GDPR Art. 17 / KVKK Art. 11 | Account → Privacy → "Delete my account" → confirm (typed email) → grace period banner → hard delete |
| Portability | GDPR Art. 20 | Same job as Access, format: JSON manifest + original files in zip |
| Rectification | GDPR Art. 16 / KVKK Art. 11 | Inline edit on profile fields |
| Restriction / Objection | GDPR Art. 18/21 | Pause processing toggle for analytics; for storage, contact form |
| Withdraw consent | both | Cookie preferences modal; immediate effect, no dark patterns |

Acceptance: every DSR action is reachable in **≤ 3 clicks** from the avatar menu, keyboard‑operable, screen‑reader
announced, and yields a request id the user can quote in support.

## 6. Sentry PII scrubber

The `Instance` is the single egress for errors; the reporter sits behind it and a `beforeSend` hook scrubs before
network egress.

```ts
// service/interceptors/sentry-scrub.ts (Phase 0)
const PII_KEYS = /^(email|password|token|authorization|cookie|set-cookie|passphrase|path|name|displayname|avatarurl)$/i;
const PII_VALUE = /(eyJ[A-Za-z0-9_-]{10,}|sk_[a-z]+_[A-Za-z0-9]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;

export function scrub(event: SentryEvent): SentryEvent {
  walk(event, (k, v) => {
    if (PII_KEYS.test(k)) return '[redacted]';
    if (typeof v === 'string') return v.replace(PII_VALUE, '[redacted]');
    return v;
  });
  // strip request bodies and query strings; keep ApiError.code + httpStatus only
  if (event.request) { delete event.request.data; delete event.request.query_string; }
  return event;
}
```

Hard rules: **never** transmit `Path`, `Name`, secure‑folder tokens, auth payloads, or presigned URLs. Breadcrumbs
inherit the same scrubber. Verified by a Phase 0 test that fires a representative error and asserts the captured
payload is clean. See [observability](./observability.md).

## 7. WebAuthn consent

WebAuthn registration prompts a platform credential dialog; before triggering it, we show our own consent step that
explains:
- What is stored (a public key + credential id on our servers; the private key never leaves the device).
- That biometrics/PIN are handled by the OS, not us.
- That removing the credential at any time is one click from Account → Security.

The prompt copy is i18n‑gated and reviewed for KVKK explicit‑consent wording (biometric data is `özel nitelikli` if any
biometric is captured by us — we capture **none**; we still disclose). No PII in WebAuthn telemetry beyond
`credentialId` hash.

## 8. Breach notification readiness

GDPR Art. 33 requires 72‑hour controller notification; KVKK requires "en kısa sürede" (KVKK Board guidance: 72h).
Frontend obligations:
1. **Status surface**: a `/status` page (Phase 7) and an in‑app banner driven by a `system.incident` socket event that
   can be flipped to "security incident — see notice" without a deploy.
2. **Forced re‑auth**: an Instance flag (`X-Force-Reauth: 1` response header) clears all caches and routes to sign‑in.
3. **Token rotation**: WebAuthn credentials and refresh tokens can be revoked server‑side; the client handles `401` by
   re‑auth, already covered by the Instance.
4. **User notice channel**: in‑app notification + email; both i18n‑gated; copy templates live in `content/legal/notices/`.

The frontend does not decide whether to notify — it makes notification operationally cheap.

## 9. Phase ownership

| Phase | Privacy/compliance deliverables |
|---|---|
| **P0 — Foundation** | Sentry PII scrubber + test; Instance never logs bodies/tokens; `ConsentRecord` type + storage helpers; lint rule banning `localStorage.setItem` outside an allowlist (forces review for new PII surfaces). |
| **P1 — Shell & Auth** | Cookie/consent banner + modal; `/privacy` `/terms` `/cookies` `/data-processing` page shells with content pipeline; footer links; WebAuthn consent copy. |
| **P2 — Storage Core (account UX surfaces ride along)** | Account → Privacy panel: DSR actions (Access/Erasure/Portability), consent review, active sessions, WebAuthn credentials list. |
| **P7 — Public Polish** | Final legal copy review (EN + TR); `/status` page; incident banner wiring; analytics opt‑out audited end‑to‑end; a11y sweep over consent surfaces; sub‑processor list finalized; release checklist gate. |

Anything outside these phases that touches PII (new endpoint, new event, new cookie) is a **stop‑and‑review** moment;
update this doc and the consent matrix before shipping.

## 10. Open items

- Decide whether error monitoring runs under **essential** (security) or **analytics** consent. Default plan: analytics
  gate, with a minimal crash‑only fallback that fires only on `chunkLoadError` / boot failures (no user context). Owner:
  P0 spike, lock before P1.
- Confirm TR DPO appointment requirement (Veri Sorumluları Sicili / VERBİS threshold) and reflect in `/privacy`.
- Sub‑processor list: needs final vendor confirmations (storage backend, email, error monitor, analytics).
- Data residency: do we offer EU‑only buckets at MVP? Defer to backend; surface in `/data-processing` when ready.
- Age gating: minimum age clause in ToS — confirm 16 (GDPR default) vs lower MS‑specific thresholds; TR has no explicit
  digital age but parental consent applies under 18.
- Retention schedule: per‑category retention table for `/privacy` — pending backend confirmation.

## 11. Cross‑references

- [observability](./observability.md) — telemetry rules this doc enforces.
- [feature-flags](./feature-flags.md) — gating for analytics and consent rollout.
- [i18n](./i18n.md) — all consent and legal copy is i18n‑gated.
- [accessibility](./accessibility.md) — consent UI must pass the same a11y bar.
- [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md) — token non‑persistence rule.
- [data-layer](../02-architecture/data-layer.md) — Instance is the single egress; scrubber lives here.
- [CONVENTIONS](../00-overview/CONVENTIONS.md) — PascalCase API props, no hardcoded copy.
- [DECISIONS](../07-decisions/DECISIONS.md) — record locked choices from §10 here.
- [API-INVENTORY](../05-api/API-INVENTORY.md) — DSR endpoints (`/account/export`, `/account/delete`, `/consent`).
