# STATUS.md — progress tracker

> Lightweight tracker. Source of truth for phase detail is [ROADMAP.md](./ROADMAP.md).
> Legend: ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

**Updated:** 2026-05-30 · **Branch:** `v2` · **Round:** Planning (no app code yet).

## This round (planning) — ✅ complete, awaiting approval
- [x] Explored 3 layers (API `nestjs-storage`, old frontend `main`, v2 scaffold) — read-only
- [x] Verified contract (controllers, envelope, headers, secure-folder tokens, gateway, **Share absent**)
- [x] Authored planning docs: `API-INVENTORY`, `ARCHITECTURE`, `FEATURE-MAP`, `ROADMAP`, `DECISIONS`, `STATUS`
- [x] Locked 4 decisions (Share, conflict, job transport, auth)
- [ ] **Awaiting user approval to begin Phase 0**

## Phase status
| Phase | Title | Status | Notes |
|---|---|---|---|
| 0 | Foundation + Design System | ⏳ | next up on approval; top risk = Auth.js v5 ↔ Next 16.2 |
| 1 | Auth | ⏳ | |
| 2 | App Shell + Account | ⏳ | |
| 3 | Storage Core | ⏳ | |
| 4 | Preview + Share | ⏳ | Share = presigned URL |
| 5 | Secure Folders | ⏳ | |
| 6 | Advanced | ⏳ | |
| 7 | Public & Polish | ⏳ | |
| 8 | Teams (LAST) | ⏳ | architect-for now, build last |

## Current scaffold state (v2)
- Installed: `next@16.2.6`, `react@19.2.4`; dev: openapi-generator-cli, shadcn@4, tailwindcss@4, eslint.
- Present: `openapitools.json`, `service/factories.ts`, `service/generates/` (committed), Tailwind v4 `globals.css`.
- **Missing (Phase 0):** all feature deps, `lib/api/Instance.ts`, shadcn init (`components.json`), motion/i18n/theme, providers, routes.

## What's next
1. Get approval on this plan + the 4 decisions + open questions (esp. Q1 sharing, Q5 CDN).
2. On "implement Phase 0", read `node_modules/next/dist/docs/01-app/`, then execute Phase 0 checklist.

## Blockers / waiting on
- **User approval** of the planning round.
- **API team** on Q1 (real share backend) and Q2 (webhook HMAC) — non-blocking for MVP.
