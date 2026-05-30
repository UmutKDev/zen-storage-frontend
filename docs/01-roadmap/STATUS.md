# STATUS — progress tracker

> Lightweight, **always‑current** tracker. The source of truth for phase *detail* is each
> [`phases/phase-N-*.md`](./phases/) file; this is the one‑screen "where are we" view.
>
> Legend: ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

**Updated:** 2026-05-30 · **Branch:** `v2` · **Round:** Planning (no application code yet).

## Where we are
Planning round **complete and expanded**. The docs are now a deep, navigable hierarchy with per‑phase, per‑feature,
per‑module detail. **Awaiting approval to begin Phase 0.**

## Planning round checklist — ✅ complete
- [x] Explored 3 layers (API `nestjs-storage`, old frontend `main`, v2 scaffold) — read‑only
- [x] Verified contract (controllers, envelope, headers, secure‑folder tokens, gateway, **Share absent**)
- [x] Authored core planning docs (roadmap, architecture, feature map, API inventory, decisions)
- [x] Locked 4 decisions (Share, conflict, job transport, auth)
- [x] **Restructured** docs into category hierarchy; expanded every area to maximum detail
- [ ] **Awaiting user approval to begin Phase 0**

## Phase status
| Phase | Title | Status | Notes |
|---|---|---|---|
| 0 | Foundation + Design System | ⏳ | next up on approval; top risk = Auth.js v5 ↔ Next 16.2 |
| 1 | Auth | ⏳ | session‑id multi‑step flow |
| 2 | App Shell + Account | ⏳ | no team switch |
| 3 | Storage Core | ⏳ | upload pipeline is the heavy lift |
| 4 | Preview + Share | ⏳ | Share = presigned URL; CDN resize `UNVERIFIED` |
| 5 | Secure Folders | ⏳ | token never‑persist guarantee |
| 6 | Advanced | ⏳ | socket‑first + poll for jobs |
| 7 | Public & Polish | ⏳ | **MVP completes here** |
| 8 | Teams (LAST) | ⏳ | architect‑for now, build last |

## Current scaffold state (v2)
- **Installed:** `next@16.2.6`, `react@19.2.4`, `react-dom@19.2.4`; dev: `@openapitools/openapi-generator-cli`,
  `shadcn@4`, `tailwindcss@4`, `eslint`, `typescript`.
- **Present:** `openapitools.json` (generator `typescript-axios` 7.17.0 → `service/generates`, `modelPackage:"dto"`,
  `useSingleRequestParameter`, `withInterfaces`), `service/factories.ts` (11 factories wired on `./Instance`),
  `service/generates/` (committed), Tailwind v4 `globals.css` (only `--background`/`--foreground` so far),
  `tsconfig.json` path alias `@/*`.
- **Note:** `service/factories.ts` imports `./Instance` (i.e. `service/Instance.ts`) which **does not exist yet** —
  Phase 0 creates it. (Architecture doc proposes `lib/api/Instance.ts`; reconcile the location in Phase 0 — see
  [open questions](../07-decisions/open-questions.md).)
- **Missing (Phase 0 builds):** all feature deps (TanStack Query, Zustand, Auth.js, socket.io‑client, framer‑motion,
  dnd‑kit, rhf+zod, sonner, react‑virtual, CodeMirror, qrcode.react, @simplewebauthn/browser, lucide), the `Instance`,
  shadcn init (`components.json`), motion/i18n/theme libs, providers, route groups.

## What's next
1. Get approval on the plan + the 4 decisions + the open questions (esp. Q1 sharing, Q5 CDN, and the `Instance`
   location).
2. On "implement Phase 0": **read `node_modules/next/dist/docs/01-app/` first**, then execute the
   [Phase 0 checklist](./phases/phase-0-foundation.md).

## Blockers / waiting on
- **User approval** of the planning round.
- **API team** on Q1 (real share backend) and Q2 (webhook HMAC) — non‑blocking for MVP.
