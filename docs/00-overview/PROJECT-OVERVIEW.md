# Project Overview

> The 10‑minute briefing for anyone joining the v2 frontend. Read this, then the [ROADMAP](../01-roadmap/ROADMAP.md).

## What we are building

A **v2 frontend**, from scratch, for an existing cloud‑storage SaaS — think Google Drive / Yandex Disk: upload, browse,
preview, edit, organize, and share files; personal storage now, team storage later. The backend (NestJS) already
exists and is feature‑complete; **this project replaces the old frontend with a premium, animated, maintainable
rebuild.**

The product surface, end to end:

- **Public** — landing, features, pricing (pricing is "coming soon", no checkout in MVP).
- **Auth** — register, multi‑step login (password + 2FA + passkey), password reset.
- **Account** — profile, security (change password, 2FA/TOTP, passkeys, session history), subscription view.
- **Storage** — list & smart‑grid browsing, breadcrumb deep‑linking, usage bar, upload pipeline, create file/folder,
  rename/move/delete, multi‑select + bulk, drag‑and‑drop move, search (global vs current folder), filter & sort.
- **Preview & edit** — image/video/PDF/text/audio/office modal, in‑browser code editing (CodeMirror with lock + draft), version
  history + restore, share (presigned URL).
- **Secure folders** — encrypted folders (passphrase) and hidden folders (`Shift Shift` reveal), with a short‑lived
  in‑memory session‑token lifecycle.
- **Advanced** — duplicate scan, archive (zip/extract), notifications (toasts + inbox).
- **Teams (last)** — workspace switch (Personal ↔ Team), members, invitations, team storage — architected for now,
  built last.

## The three code layers (context)

This rebuild sits between three codebases. Knowing which is which prevents most mistakes.

| Layer | Repo / location | Role | Rule |
|---|---|---|---|
| **API (NestJS)** | `nestjs-storage` | **Contract source of truth.** Controllers + OpenAPI/Swagger + generated client define every request/response. | Read‑only. Verify every endpoint claim against it. |
| **Old frontend** | `main` branch of this repo (`storage-client`) | **Reference for behavior/UX.** Most features already exist there. | Mine for flows; don't copy legacy code blindly. |
| **v2 frontend** | `v2` branch (`nextjs-storage`, this repo) | **The clean target.** Where we build and where these docs live. | All new code & docs go here. |

> The detailed endpoint catalog is in [`05-api/API-INVENTORY.md`](../05-api/API-INVENTORY.md). The architecture that
> consumes it is in [`02-architecture/ARCHITECTURE.md`](../02-architecture/ARCHITECTURE.md).

## What "MVP" means here

**MVP = the entire Personal experience, polished**, with a **rock‑solid storage core as the #1 priority.** Concretely,
MVP is **Phases 0–7**: foundation, auth, account, storage core, preview/share, secure folders, advanced features, and
public pages + polish. **Teams (Phase 8) and the backend‑gated organization features (Phase 9) are explicitly post‑MVP**,
but everything is architected so they need no refactor.

> 📌 The sharp, decided MVP scope — priority order, in/out cut line, quality bar, and which *new* features are MVP vs
> backend‑gated — lives in **[MVP-DEFINITION.md](./MVP-DEFINITION.md)**. Read it before debating scope.

**Added this round (MVP):** command palette + keyboard shortcuts, observability (error monitoring + analytics), feature
flags, onboarding/first‑run — all **frontend‑only** — plus **audio + office preview** (Q4). **Favorites, recents, tags,
and storage insights are post‑MVP** (backend‑first, no interim — Q10–Q13). See [MVP-DEFINITION](./MVP-DEFINITION.md).

Deliberately **out** of MVP (post‑MVP):
- **Teams UI** — architected for, shipped last ([phase-8](../01-roadmap/phases/phase-8-teams.md)).
- **Tags/labels, synced favorites/recents, global insights** — **the backend doesn't support these today**; see
  [backend-gaps](../07-decisions/backend-gaps.md) and [phase-9](../01-roadmap/phases/phase-9-organization.md).
- **Trash / recycle bin** — not in the API yet; delete UX is designed so a future trash/restore slots in.
- **Avatar upload** — endpoint exists but is **inactive**; read‑only avatar at MVP, upload activates post‑backend (Q7).
- **PWA / offline** — larger effort, low MVP value ([pwa-offline](../06-cross-cutting/pwa-offline.md)).
- **Checkout / plan management** — Pricing is a "coming soon" showcase.
- **Developer API / webhooks UI** — scaffolded, post‑MVP. **Second language** — i18n structured now, EN ships.

## Non‑negotiable principles

1. **Contract first, no invention.** Every behavior traces to real backend code (file paths in the API docs). Anything
   unproven is marked **`UNVERIFIED`** and tracked in [`07-decisions/open-questions.md`](../07-decisions/open-questions.md).
2. **Generated client only.** All calls go through generated **factories** on one shared axios **`Instance`**; all DTOs
   are generated **models**. No raw `fetch`/`axios`, no hand‑rolled types. (See [`02-architecture/data-layer.md`](../02-architecture/data-layer.md).)
3. **PascalCase everywhere** for API models (`Id`, `Email`, `Path`, `Key`, `CreatedAt`) — it mirrors the backend and is
   project‑wide. (See [`CONVENTIONS.md`](./CONVENTIONS.md).)
4. **Premium by default.** Motion is part of the design system, not sprinkled on later. shadcn primitives are pulled via
   the **shadcn MCP** and customized, not hand‑copied. (See [`03-design-system/DESIGN-SYSTEM.md`](../03-design-system/DESIGN-SYSTEM.md).)
5. **Team‑ready, Teams‑last.** Build the owner/team plumbing now; expose team UI only in Phase 8.
6. **Phase discipline.** Ship a phase only when its acceptance‑test checklist passes; don't pull later‑phase work
   forward without updating the ROADMAP.

## Success criteria (definition of done for the MVP)

- A user can register/sign in (incl. 2FA & passkey), manage their account & security, and stay signed in across reloads.
- A user can browse, upload (large files via multipart, with a resilient queue), create, rename, move, delete (single &
  bulk), search, filter, and sort their files — smoothly, even in large folders.
- A user can preview image/video/PDF/text/audio/office, edit text safely (locking + drafts + version restore), and share via link.
- A user can create encrypted and hidden folders and work inside them within the token lifecycle.
- A user can run duplicate scans and archive operations with live progress, and receive notifications.
- Public pages (landing/features/pricing) are live; the whole app is responsive, accessible (baseline), themed
  (light/dark), animated (with reduced‑motion support), and internationalization‑ready (EN copy via keys).
- Everything works under a single shared data layer with consistent error/empty/loading/quota/secure states.

## Top risks (carried in every phase doc)

- **Bleeding‑edge stack:** Next 16.2 + React 19 + Auth.js v5 compatibility — the #1 early risk (validated in Phase 0).
- **Multipart upload edge cases:** abort/retry/idempotency correctness.
- **Secure‑folder tokens:** never‑persist guarantee, ancestor lookup, TTL re‑prompt loops.
- **Realtime job lifecycle:** missed socket events, reconnect correctness (mitigated by polling fallback).
- **CDN image resizing (`?w=&h=`):** ✅ resolved — supported via `cdn.storage.umutk.me` → wsrv.nl (object URLs HMAC‑signed by rustfs).

See the full list in [`01-roadmap/ROADMAP.md`](../01-roadmap/ROADMAP.md#global-risks) and per‑phase risk sections.
