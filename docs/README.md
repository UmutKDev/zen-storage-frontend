# v2 Frontend — Planning & Architecture Docs

> **Living documentation** for the `nextjs-storage` v2 rebuild (Next 16.2 / React 19) of a cloud‑storage SaaS
> (Google Drive / Yandex Disk style). This is the **single source of truth** for *what* we are building, *how* it is
> architected, *how it looks/moves*, and *in what order* we ship it.
>
> **Round:** Planning (no application code yet). **Branch:** `v2`. **Last structural update:** 2026-05-30.

This folder is organized as a **deep, navigable hierarchy** — not a flat pile of files. Each top‑level number is a
**category**; everything you need to implement a phase is reachable from here in two clicks.

---

## 🚦 Start here

| If you want to… | Open |
|---|---|
| Understand the project at a glance | [`00-overview/PROJECT-OVERVIEW.md`](./00-overview/PROJECT-OVERVIEW.md) |
| See the full phased plan & status | [`01-roadmap/ROADMAP.md`](./01-roadmap/ROADMAP.md) |
| Implement the next phase | the matching file in [`01-roadmap/phases/`](./01-roadmap/phases/) |
| Know how the frontend is wired | [`02-architecture/ARCHITECTURE.md`](./02-architecture/ARCHITECTURE.md) |
| Build UI that matches the look/feel | [`03-design-system/DESIGN-SYSTEM.md`](./03-design-system/DESIGN-SYSTEM.md) |
| Spec a single feature/screen | the matching file in [`04-features/`](./04-features/) |
| Find an API endpoint contract | [`05-api/API-INVENTORY.md`](./05-api/API-INVENTORY.md) |
| Know why a choice was made | [`07-decisions/DECISIONS.md`](./07-decisions/DECISIONS.md) |

---

## 🗂️ Category map

```
docs/
├── README.md                     ← you are here (navigation hub)
├── INIT.MD                       ← the original planning prompt (reference, do not edit)
│
├── 00-overview/                  WHAT & WHY
│   ├── PROJECT-OVERVIEW.md        product, the 3 code layers, MVP definition, success criteria
│   ├── GLOSSARY.md                shared vocabulary (owner vs user, envelope, secure folder…)
│   ├── CONVENTIONS.md             naming, query keys, folders, commits, PascalCase rule
│   └── DOC-WORKFLOW.md            how to read & update these docs; the phase workflow
│
├── 01-roadmap/                   WHEN & IN WHAT ORDER
│   ├── ROADMAP.md                 master phase index, status snapshot, changelog, global risks
│   ├── STATUS.md                  live progress tracker
│   └── phases/
│       ├── phase-0-foundation.md       phase-1-auth.md            phase-2-shell-account.md
│       ├── phase-3-storage-core.md     phase-4-preview-share.md   phase-5-secure-folders.md
│       └── phase-6-advanced.md         phase-7-public-polish.md   phase-8-teams.md
│
├── 02-architecture/             HOW IT IS WIRED
│   ├── ARCHITECTURE.md            index: tech stack + folder structure + how the pieces connect
│   ├── data-layer.md              generated client + axios Instance + envelope/error layer
│   ├── state-management.md        TanStack Query keys + Zustand stores
│   ├── routing-deep-linking.md    App Router route groups + folder deep-linking + modals
│   ├── auth-integration.md        Auth.js v5 session-id flow
│   ├── realtime-socket.md         socket.io lifecycle, fan-out, job transport
│   ├── upload-pipeline.md         multipart/presigned queue & tray
│   ├── conflict-resolution.md     reusable FAIL/REPLACE/SKIP/KEEP_BOTH pattern
│   ├── secure-folder-lifecycle.md in-memory token store, ancestor lookup, TTL re-prompt
│   ├── state-matrix.md            per-surface state matrix (loading…permission-denied)
│   └── team-readiness.md          build-for-teams-now, ship-last
│
├── 03-design-system/            HOW IT LOOKS & MOVES  (separate, on purpose)
│   ├── DESIGN-SYSTEM.md           index + premium-shadcn philosophy + intake via shadcn MCP
│   ├── foundations/               color.md · typography.md · spacing-layout.md · elevation-borders.md
│   ├── motion/                    tokens.md · variants.md · reduced-motion.md
│   ├── components/                primitives.md · patterns.md
│   └── theming.md                 light/dark, system preference, token mapping
│
├── 04-features/                 WHAT THE USER GETS  (screen-level specs)
│   ├── FEATURE-MAP.md             master feature → screen → endpoint → state index
│   ├── auth.md · account.md
│   ├── storage-browse.md · storage-upload.md · storage-operations.md · storage-search-filter.md
│   ├── preview.md · secure-folders.md · advanced.md · public.md · teams.md
│
├── 05-api/                      THE CONTRACT  (source of truth = nestjs-storage)
│   ├── API-INVENTORY.md           index: global conventions + feature cross-map
│   └── modules/                   authentication · account · cloud-core · cloud-directory ·
│                                  cloud-upload · cloud-archive · documents · subscription ·
│                                  notifications · teams · api-module
│
├── 06-cross-cutting/            APPLIES EVERYWHERE
│   ├── i18n.md · accessibility.md · performance.md · testing.md · seo-metadata.md
│
└── 07-decisions/               THE WHY
    ├── DECISIONS.md               decided log (with rationale + consequences)
    └── open-questions.md          open Qs with owner, impact, default, phase-to-resolve
```

---

## 🧭 How these docs relate

```
                       00-overview  (why we build, vocabulary, conventions)
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                       ▼
  01-roadmap            02-architecture          03-design-system
 (order + phases)       (how it's wired)        (how it looks/moves)
        │                     │                       │
        └──────────┬──────────┴───────────┬───────────┘
                   ▼                       ▼
             04-features              05-api  ──► nestjs-storage (contract truth)
        (screens consume the          (endpoint catalog)
         architecture, design,
         and API)
                   │
                   ▼
            06-cross-cutting (i18n / a11y / perf / testing / seo)
                   │
                   ▼
            07-decisions (records every fork above)
```

A **feature spec** (`04-features/*`) points *down* to the endpoints it uses (`05-api/*`) and *up* to the architecture
patterns (`02-architecture/*`) and design tokens (`03-design-system/*`) it must obey. A **phase file**
(`01-roadmap/phases/*`) is the *assembly instruction*: it lists which feature specs, architecture concerns, and design
pieces are in scope for that phase, plus the acceptance tests that close it.

---

## ✅ Implementation protocol (read before coding any phase)

1. **Before any Phase‑0 code:** read `node_modules/next/dist/docs/01-app/`. `AGENTS.md` warns this Next version has
   breaking changes vs. training data.
2. Open the phase file in [`01-roadmap/phases/`](./01-roadmap/phases/). It is the checklist of record.
3. For each task, follow the linked **feature spec** + **architecture concern** + **design** doc. Do not re-derive
   conventions — they live in [`00-overview/CONVENTIONS.md`](./00-overview/CONVENTIONS.md).
4. Every API call goes through a **generated factory** on the shared `Instance`; every DTO is a **generated model**.
   See [`02-architecture/data-layer.md`](./02-architecture/data-layer.md). Never hand-roll a call or a type.
5. Close the phase only when its **acceptance-test checklist** passes. Update
   [`01-roadmap/STATUS.md`](./01-roadmap/STATUS.md) and add a Changelog line to
   [`01-roadmap/ROADMAP.md`](./01-roadmap/ROADMAP.md).

**Update rule:** these are *living* docs — **edit the relevant section, don't rewrite a whole file**, and note material
changes in the ROADMAP changelog. See [`00-overview/DOC-WORKFLOW.md`](./00-overview/DOC-WORKFLOW.md).

---

## 📌 Locked context (full list in DECISIONS)

- **Order:** Personal end-to-end first → **Teams is the LAST phase** (but architected for from day one).
- **Auth:** session-based (session id via cookie / `X-Session-Id`), no refresh token to the client.
- **Design:** premium feel on **shadcn/ui + Tailwind v4**, **framer-motion** motion system designed in Phase 0.
- **Share:** presigned-URL based (no dedicated backend share API today). **Trash:** not in MVP (design leaves room).
- **i18n:** EN-only at MVP, all copy via keys. **Theme:** light/dark with system preference.
