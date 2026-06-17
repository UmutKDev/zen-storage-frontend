# MVP Definition

> The MVP is the **most important milestone right now.** This file is the sharp, decided answer to "what *is* the MVP,
> what's the #1 priority, what's in, what's out, and how do we know it's done." When scope is debated, this file wins.
> Companion: [PROJECT-OVERVIEW](./PROJECT-OVERVIEW.md) · [ROADMAP](../01-roadmap/ROADMAP.md) ·
> [backend-gaps](../07-decisions/backend-gaps.md).

## 1. The one‑sentence MVP
**A single user can manage their personal files end‑to‑end — browse, upload, organize, preview, edit, secure, and share —
in a fast, polished, accessible app.** Personal only; Teams later.

## 2. The #1 priority: a **rock‑solid storage core**
Everything else builds on it, so it must be flawless first. Storage core = **browse (list/grid) · navigate (breadcrumb +
deep‑link) · upload (resilient multipart) · create/rename/move/delete (single + bulk + dnd) · search/filter/sort ·
conflict handling · quota enforcement** — smooth even in large folders. (Phase 3 is the heart;
[phase-3](../01-roadmap/phases/phase-3-storage-core.md).)

> Decision: when trading off, **invest in storage‑core robustness over breadth.** A new feature that destabilizes
> upload/list is not worth it.

## 3. Priority order (how we sequence and where we invest)
1. **Foundation** that makes everything else cheap & safe (data layer, design/glass system, auth) — Phases 0–1.
2. **Shell + account** so a real user can live in the app — Phase 2.
3. **Storage core** — the heart — Phase 3.
4. **Preview/edit/share + secure folders** — the daily value — Phases 4–5.
5. **Advanced (jobs) + public/polish** — completeness + the premium finish — Phases 6–7.

## 4. In MVP (Phases 0–7)
- Auth (register, multi‑step login incl. 2FA + passkey, reset, full sign‑out teardown).
- App shell + Account/Security + read‑only subscription view.
- **Storage core** (the whole of §2).
- Preview (image/video/PDF/text/**audio**/**office** — office best‑effort) + text editing (lock/draft/version restore) + **Share via presigned URL**.
- Secure folders (encrypted + hidden) with the in‑memory token lifecycle.
- Advanced: duplicate scan, archive, notification inbox.
- Public pages (landing/features/pricing "coming soon") + responsiveness + a11y baseline + performance budget +
  full state‑matrix coverage + i18n‑ready (EN).
- **Premium feel:** the glass design system + motion (reduced‑motion aware) is part of MVP, not a later coat of paint.

### MVP‑included from the new scope round
| Added item | In MVP? | Notes |
|---|---|---|
| **Command palette + keyboard shortcuts** | ✅ MVP | Frontend‑only; foundation in Phase 0, palette in Phase 3. [keyboard-shortcuts](../06-cross-cutting/keyboard-shortcuts.md) |
| **Observability** (error monitoring + product analytics) | ✅ MVP | Frontend‑only; set up Phase 0, verified Phase 7. [observability](../06-cross-cutting/observability.md) |
| **Feature flags** | ✅ MVP | Frontend‑only (no backend module); Phase 0. [feature-flags](../06-cross-cutting/feature-flags.md) |
| **Onboarding / first‑run** | ✅ MVP | Frontend‑only; Phase 7. [onboarding](../04-features/onboarding.md) |
| **Preview: audio + office** | ✅ MVP | **Resolved (Q4):** added to image/video/PDF/text. Office is best‑effort client render + download fallback. Phase 4. [preview](../04-features/preview.md) |
| **Sharing (presigned URL)** | ✅ MVP | **Resolved (Q1):** `Cloud/PresignedUrl` *is* the share mechanism — a signed, time‑limited link (HMAC via rustfs). No separate share backend planned; managed permissions/revoke are out of scope. [sharing](../04-features/sharing.md) |
| **Favorites / Recents / Tags / Insights** | ❌ post‑MVP | **Decided (Q10–Q13):** all **backend‑first** — need real APIs before any UI; **no MVP interim**. → [phase-9](../01-roadmap/phases/phase-9-organization.md), [backend-gaps](../07-decisions/backend-gaps.md). |

## 5. Out of MVP (post‑MVP)
| Item | Why out | Where |
|---|---|---|
| **Teams** | Personal‑first decision; architected for, shipped last | [phase-8](../01-roadmap/phases/phase-8-teams.md) |
| **Favorites / Recents** | **No backend API**; backend‑first, **no MVP interim** (Q10/Q11) | [phase-9](../01-roadmap/phases/phase-9-organization.md) |
| **Tags / labels** | **No backend API**; needs entity + CRUD (Q12) | [phase-9](../01-roadmap/phases/phase-9-organization.md) |
| **Storage insights** | **No aggregate endpoint** (Q13); backend‑driven | [phase-9](../01-roadmap/phases/phase-9-organization.md) |
| **Trash / recycle bin** | Not in the API | design leaves room (D4) |
| **Pricing checkout / plan management** | Out of scope | Pricing stays "coming soon" |
| **PWA / offline** | Larger effort, low MVP value | [pwa-offline](../06-cross-cutting/pwa-offline.md) (post‑MVP) |
| **Developer API / webhooks UI** | Not user‑facing MVP | scaffold only |
| **2nd language** | i18n structured now, EN ships | — |

> ⚠ **Backend reality:** several *new end‑user* features (favorites, recents, tags, insights) are **not supported by the
> backend today.** Decision (Q10–Q13): they will be built **backend‑first** and are **post‑MVP — with no client‑side
> interim** (we don't fake server‑backed state; D‑S8). They're documented so the UI drops in cleanly once the APIs exist;
> tracked in [backend-gaps](../07-decisions/backend-gaps.md).

## 6. The MVP quality bar (definition of done)
MVP is "done" only when, across **every** surface:
- Works for the happy path **and** all applicable [state‑matrix](../02-architecture/state-matrix.md) states
  (empty/no‑results/error/locked/reveal‑required/quota).
- Goes through the generated **factory + `Instance`** (no raw fetch, no hand‑rolled DTOs).
- Copy is via **i18n keys**; UI uses **semantic tokens + glass discipline**; **motion respects reduced‑motion**.
- Is **keyboard‑accessible** with visible focus (a11y baseline).
- Meets the **performance budget** (virtualized lists, lazy heavy modules).
- Has the test coverage named in [testing](../06-cross-cutting/testing.md) for its risk tier.
- Errors are observable (error monitoring) without leaking PII.

## 7. Anti‑goals (explicitly not chasing at MVP)
Breadth over depth; faking server features the backend can't back; team UI; checkout; pixel‑experiments that risk the
storage core; AAA accessibility (AA is the bar); offline‑first.
