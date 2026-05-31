# ROADMAP — v2 Frontend (master plan)

> The **living, phase‑by‑phase plan**. This file is the *index*: each phase has a one‑paragraph summary here and a
> **detailed file** in [`phases/`](./phases/) with the task breakdown, acceptance tests, risks, and rollback.
> Progress is tracked in [`STATUS.md`](./STATUS.md).
>
> **Order:** Personal end‑to‑end → **Teams last**. Pricing "coming soon". Design: premium shadcn + framer‑motion.
> **Update rule:** edit the relevant phase summary or its `phases/` file — **don't rewrite** — and add a Changelog line.

## Changelog
- **2026-05-30 (scope round)** — Broadened scope + sharpened MVP. Added [MVP-DEFINITION](../00-overview/MVP-DEFINITION.md)
  (MVP #1 priority = rock‑solid storage core) and a [backend-gaps matrix](../07-decisions/backend-gaps.md). New
  frontend‑only MVP scope: command palette + shortcuts, observability, feature flags, onboarding (woven into Phases 0/3/7).
  New **Phase 9 — Organization & Discovery** (post‑MVP, **backend‑gated**: favorites/recents/tags/global‑insights/real
  share). New feature specs (quick-access, tags, storage-insights, onboarding, sharing) + platform docs
  (keyboard-shortcuts, observability, feature-flags, pwa-offline). Scope decisions logged D‑S1..D‑S8.
- **2026-05-30 (restructure)** — Reorganized docs into a deep category hierarchy; each phase expanded into its own
  detailed file under `phases/`; added per‑feature specs, a separate design system, per‑module API docs, and
  cross‑cutting plans. No phase scope changed; detail greatly increased.
- **2026-05-30 (initial)** — Initial roadmap from the planning round. Findings verified against API + old frontend;
  4 decisions locked (Share = presigned URL; conflict = prompt + apply‑to‑all; jobs = socket‑first + poll;
  auth = Auth.js v5). Awaiting approval to start **Phase 0**.

## Status snapshot
| Phase | Title | Detailed plan | Status |
|---|---|---|---|
| 0 | Foundation + Design System | [phase-0](./phases/phase-0-foundation.md) | ⏳ not started |
| 1 | Auth | [phase-1](./phases/phase-1-auth.md) | ⏳ |
| 2 | App Shell + Account | [phase-2](./phases/phase-2-shell-account.md) | ⏳ |
| 3 | Storage Core | [phase-3](./phases/phase-3-storage-core.md) | ⏳ |
| 4 | Preview + Share | [phase-4](./phases/phase-4-preview-share.md) | ⏳ |
| 5 | Secure Folders | [phase-5](./phases/phase-5-secure-folders.md) | ⏳ |
| 6 | Advanced | [phase-6](./phases/phase-6-advanced.md) | ⏳ |
| 7 | Public & Polish (**MVP done**) | [phase-7](./phases/phase-7-public-polish.md) | ⏳ |
| 8 | Teams (post‑MVP) | [phase-8](./phases/phase-8-teams.md) | ⏳ |
| 9 | Organization & Discovery (post‑MVP, **backend‑gated**) | [phase-9](./phases/phase-9-organization.md) | ⏳ |

Legend: ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

> **MVP = Phases 0–7** (Personal, polished; #1 priority = storage core). **Post‑MVP = Phases 8–9.** Full cut line:
> [MVP-DEFINITION](../00-overview/MVP-DEFINITION.md). Backend‑blocked items: [backend-gaps](../07-decisions/backend-gaps.md).

---

## Dependency graph

```
        ┌─────────────────────────── Phase 0 — Foundation + Design System ──────────────────────────┐
        │  data layer · design/motion · theming · i18n · routing · providers · socket · team-ready    │
        └───────────────┬───────────────────────────────────────────────────────────────────────────┘
                        │ (everything depends on Phase 0)
            ┌───────────▼───────────┐
            │  Phase 1 — Auth        │  session-id flow, login/2FA/passkey/reset
            └───────────┬───────────┘
            ┌───────────▼───────────┐
            │ Phase 2 — Shell+Account│  authenticated shell, account & security, subscription view
            └───────────┬───────────┘
            ┌───────────▼───────────┐
            │ Phase 3 — Storage Core │  list/grid, upload, CRUD, bulk, search/filter, conflicts
            └─────┬───────────┬──────┘
                  │           │
      ┌───────────▼──┐   ┌────▼─────────────┐
      │ Phase 4      │   │ Phase 5          │   (4 and 5 both build on Storage Core;
      │ Preview+Share│   │ Secure Folders   │    can be sequenced either order)
      └───────┬──────┘   └────┬─────────────┘
              └─────┬─────────┘
            ┌───────▼───────────┐
            │ Phase 6 — Advanced │  duplicate scan, archive, AV status, notification inbox
            └───────┬───────────┘
            ┌───────▼───────────┐
            │ Phase 7 — Public   │  landing/features/pricing + responsive/a11y/perf/polish
            │ & Polish (MVP done)│
            └───────┬───────────┘
            ┌───────▼───────────┐
            │ Phase 8 — Teams    │  workspace switch + members/invites; flips on the team layer
            │ (LAST, post-MVP)   │
            └───────────────────┘
```

**Critical path:** 0 → 1 → 2 → 3 → (4, 5) → 6 → 7 → 8. Phases 4 and 5 are independent of each other (both need 3) and
may be reordered. Phase 8 needs no refactor because the team plumbing is laid in Phase 0
(see [`team-readiness`](../02-architecture/team-readiness.md)).

---

## Phase summaries

Each summary is intentionally short — **the authoritative detail is in the linked file.**

### Phase 0 — Foundation + Design System → [details](./phases/phase-0-foundation.md)
A runnable, **team‑ready skeleton**: dependencies, conventions, the **premium shadcn + framer‑motion design/motion
system**, light/dark theming, i18n scaffold (EN), the **generated‑client wiring + improved axios `Instance`**, the
**envelope/typed‑error/toast layer**, the **socket.io client lifecycle**, routing skeleton with folder deep‑linking, and
the providers. **No feature screens, no team UI.** This phase de‑risks the bleeding‑edge stack (Next 16.2 + React 19 +
Auth.js v5).

### Phase 1 — Auth → [details](./phases/phase-1-auth.md)
Full **session‑based auth**: Auth.js v5 credentials wrapping the multi‑step flow (`Login/Check` → `Login` →
`Verify2FA`), the passkey path (bypasses 2FA), register, password reset, sign‑out that clears all client state, and
route protection for `(app)`.

### Phase 2 — App Shell + Account (Personal) → [details](./phases/phase-2-shell-account.md)
The authenticated **shell** (sidebar/topbar, theme toggle, profile menu, notification bell) and the **Account** area:
profile + avatar, security (change password, 2FA, passkeys, session history), and a read‑only subscription view.
**No team switch.**

### Phase 3 — Storage Core (Personal) → [details](./phases/phase-3-storage-core.md)
The storage browser end‑to‑end: list & smart grid, breadcrumb deep‑linking, usage bar, the **upload pipeline**
(multipart + presigned, queue/tray, progress, pause/cancel/retry, file‑drop, folder upload), create file/folder,
rename/move/delete, **multi‑select + bulk + drag‑and‑drop move**, the **conflict‑resolution dialog**, search (global vs
current), and filter/sort. **Quota pre‑flight** blocks with an upgrade hint.

### Phase 4 — Preview + Share → [details](./phases/phase-4-preview-share.md)
The **preview modal** (image/video/PDF/text) with toolbar and arrow‑key navigation; image CDN scaling +
scaled‑vs‑original download; the **text/code editor** (CodeMirror + lock + heartbeat + draft + unsaved‑changes guard);
**version history + restore** (files + documents with diff); and **Share** via presigned URL.

### Phase 5 — Secure Folders → [details](./phases/phase-5-secure-folders.md)
**Encrypted** folders (create/convert/decrypt, unlock/lock) and **hidden** folders (hide/unhide, `Shift Shift` reveal,
conceal), backed by the in‑memory **session‑token lifecycle** (ancestor lookup, TTL re‑prompt, explicit lock,
clear‑on‑logout/tab‑close) and the `Instance` header injection.

### Phase 6 — Advanced → [details](./phases/phase-6-advanced.md)
**Duplicate scan**, **archive** create/extract (with preview + selective extract), **AV scan status** gating, and the
**notification inbox** (history/unread/read) alongside toasts and quota warnings — all with **socket‑first + polling
fallback** for live jobs.

### Phase 7 — Public & Polish (MVP complete) → [details](./phases/phase-7-public-polish.md)
The **public pages** (landing, features, pricing "coming soon") plus the cross‑app polish pass: responsiveness,
accessibility baseline, performance budget, animation polish, full state‑matrix coverage, SEO/metadata, **onboarding**,
and **observability verification**. **MVP ships at the end of this phase.**

### Phase 8 — Teams Integration (post‑MVP) → [details](./phases/phase-8-teams.md)
Flip on the **team layer** with zero refactor: workspace store + Personal↔Team switch, end‑to‑end `X-Team-Id`, team
CRUD, members (roles), invitations, and team storage/quota with permission‑denied states.

### Phase 9 — Organization & Discovery (post‑MVP, backend‑gated) → [details](./phases/phase-9-organization.md)
Turn the MVP's client‑side interims into real, synced features **once the backend exposes the APIs**: synced
**favorites/recents**, **tags/labels**, and account‑wide **storage insights**. Each task is gated
on a missing endpoint ([backend-gaps](../07-decisions/backend-gaps.md)); MVP does not depend on this phase.

> **Note on added MVP scope (this round):** command palette + keyboard shortcuts, observability, and feature flags land
> in **Phase 0**; the command palette + client‑side favorites/recents/insights interim in **Phase 3**; onboarding +
> observability finish in **Phase 7**. All are **frontend‑only**; the synced/server versions live in Phase 9.

---

## Global risks / dependencies {#global-risks}

| Risk | Impact | Mitigation | Owner phase |
|---|---|---|---|
| Next 16.2 + React 19 + **Auth.js v5** compatibility | Could block auth/providers | Validate in Phase 0 spike; thin custom cookie‑session fallback | 0 / 1 |
| **OpenAPI spec reachability** at generation time (`localhost:8080/swagger-json`) | Can't regenerate client | Document regen workflow; commit generated output | 0 |
| **Multipart upload** edge cases (abort/retry/idempotency) | Data integrity, stuck uploads | Idempotency keys; explicit abort; resumable queue | 3 |
| **Secure‑folder token** never‑persist + ancestor lookup | Security + UX loops | In‑memory store; `beforeunload`/sign‑out clear; ancestor resolver tests | 5 |
| **Realtime job** missed events / reconnect | Stuck progress UI | Socket‑first + polling fallback reconciliation | 6 |
| ~~CDN `?w=&h=` resizing~~ | Image scaling + scaled download | ✅ **Resolved** — supported via `cdn.storage.umutk.me` → wsrv.nl (HMAC‑signed base URL) | 4 |
| **No backend Share / Trash** | Feature gaps vs. expectations | Presigned‑URL share; delete UX leaves room for trash | 4 / 3 |
| Scope creep in **polish** | Phase 7 overruns | Fixed checklist + performance budget | 7 |

Open questions that feed these risks are tracked in [`../07-decisions/open-questions.md`](../07-decisions/open-questions.md).

## Cross‑cutting work woven through every phase
These are not a phase; they are obligations on every screen. See [`../06-cross-cutting/`](../06-cross-cutting/i18n.md):
**i18n** (EN copy via keys), **accessibility** (keyboard/focus/ARIA), **performance** (code‑split, lazy, virtualize),
**testing** (unit/component/e2e per phase), **SEO/metadata** (public pages).
