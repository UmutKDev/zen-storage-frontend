# ROADMAP.md — v2 Frontend (living plan)

> Order: **Personal end-to-end → Teams last.** Pricing "coming soon". Design: premium shadcn + framer-motion.
> Companion docs: [API-INVENTORY](./API-INVENTORY.md) · [ARCHITECTURE](./ARCHITECTURE.md) · [FEATURE-MAP](./FEATURE-MAP.md) · [DECISIONS](./DECISIONS.md) · [STATUS](./STATUS.md).
>
> **Update rule:** don't rewrite this file — edit the relevant phase and add a Changelog line.

## Changelog
- **2026-05-30** — Initial roadmap from the planning round. Findings verified against API + old frontend; 4 decisions
  locked (Share = presigned URL; conflict = prompt + apply-to-all; jobs = socket-first + poll; auth = Auth.js v5).
  Awaiting approval to start **Phase 0**.

## Status snapshot
| Phase | Title | Status |
|---|---|---|
| 0 | Foundation + Design System | ⏳ not started |
| 1 | Auth | ⏳ |
| 2 | App Shell + Account | ⏳ |
| 3 | Storage Core | ⏳ |
| 4 | Preview + Share | ⏳ |
| 5 | Secure Folders | ⏳ |
| 6 | Advanced | ⏳ |
| 7 | Public & Polish | ⏳ |
| 8 | Teams (LAST) | ⏳ |

---

## Phase 0 — Foundation + Design System
**Objective:** a runnable, team-ready skeleton with the design/motion system, data layer, and providers — no features yet.
**In:** deps, conventions, design tokens + motion, theming, i18n scaffold, generated-client wiring + `Instance`, envelope/
error layer, socket client lifecycle, routing skeleton, providers. **Out:** any feature screen, any team UI.

- [ ] **Read `node_modules/next/dist/docs/01-app/`** (breaking changes) before coding
- [ ] Install deps (TanStack Query, Zustand, axios, next-auth, socket.io-client, framer-motion, dnd-kit, rhf+zod, sonner, @tanstack/react-virtual, CodeMirror, qrcode.react, @simplewebauthn/browser, lucide)
- [ ] `shadcn init` + pull base primitives **via shadcn MCP**; Tailwind v4 token palette in `globals.css`
- [ ] `lib/motion/` tokens + shared variants + `prefers-reduced-motion`
- [ ] Light/dark theme provider (system default)
- [ ] `lib/i18n/` dictionaries + `t()`; lint rule against hardcoded copy (EN only)
- [ ] Confirm `openapitools.json` + `npm run generate:service:test`; document regen workflow
- [ ] **`lib/api/Instance.ts`** — base/env, header injection (`X-Session-Id`/`X-Team-Id`/folder/hidden), idempotency, envelope unwrap, typed `ApiError` + toast, `401→re-auth`, `AbortSignal`/retry; build `service/factories.ts` on it
- [ ] TanStack Query provider + key conventions (team-prefixed); Notification socket provider (auth handshake, reconnect)
- [ ] Route groups `(public)/(auth)/(app)` + `storage/[[...path]]` skeleton + error/loading boundaries
- [ ] `.env` (`NEXT_PUBLIC_API_URL`), env validation

**Endpoints:** none called yet (wiring only; smoke-test `Account/Profile` via Instance).
**Acceptance:** app boots; theme + reduced-motion work; a factory call returns unwrapped typed data through `Instance`;
socket connects with a session; `git`-committed generated client regenerates cleanly.
**Risks:** Auth.js v5 ↔ Next 16.2/React 19 compat; Tailwind v4 + shadcn MCP intake; Next 16 breaking changes.

## Phase 1 — Auth
**Objective:** full session-based auth. **In:** register, multi-step login (2FA + passkey), reset, session propagation.
**Out:** account management screens (Phase 2).

- [ ] Auth.js credentials provider: `Login/Check` → `Login` → `Verify2FA` (with `X-Session-Id`); passkey `Begin`→`Finish`
- [ ] JWT (`sessionId/expiresAt/requiresTwoFactor`) + session callback fetching `Account/Profile`
- [ ] Register + reset screens (rhf/zod)
- [ ] `signOut` → `Authentication/Logout` + clear secure-folder tokens + team ctx
- [ ] Route protection for `(app)`; redirect rules

**Endpoints:** `Authentication/*` (Login/Check, Login, Verify2FA, Passkey/Login/Begin+Finish, Register, ResetPassword, Logout), `Account/Profile`.
**Acceptance:** password+2FA and passkey logins work; protected routes gate; logout fully clears state.
**Risks:** passkey browser support; 2FA step state; rate-limit (10/60s) UX.

## Phase 2 — App Shell + Account (Personal)
**Objective:** authenticated shell + account/security. **Out:** team switch.

- [ ] Shell: sidebar/topbar, theme toggle, profile menu, notification bell (unread count)
- [ ] Profile view/edit + avatar (`Account/Profile`,`/Edit`,`/Upload/Image`)
- [ ] Security: change password, 2FA (setup/verify/disable/backup codes), passkeys (list/register/delete), sessions (list/revoke/logout-all/others)
- [ ] Subscription view (`Subscription/My`) — read-only
- [ ] (Scaffold API-keys screen — optional/post-MVP)

**Endpoints:** `Account/*`, `Account/Security/*`, `Subscription/My`, `Notification/UnreadCount`.
**Acceptance:** all security flows usable; sessions revocable; subscription shows current plan.
**Risks:** backup-codes "show once" UX; passkey/WebAuthn ceremonies.

## Phase 3 — Storage Core (Personal)
**Objective:** the storage browser end-to-end. **Out:** preview/edit (Phase 4), secure folders (Phase 5), advanced (Phase 6).

- [ ] List + smart grid views; breadcrumb; folder deep-linking; virtualization
- [ ] Usage bar (`Cloud/User/StorageUsage`)
- [ ] Upload pipeline (multipart + presigned, queue/tray, progress, pause/cancel/retry, concurrency, file-drop, folder upload)
- [ ] Max-size/quota pre-flight block + upgrade hint
- [ ] Create folder / create file; rename; delete; move (dnd + dialog)
- [ ] Multi-select + bulk delete/move/download
- [ ] **Conflict-resolution dialog** (prompt + apply-to-all)
- [ ] Filter + sort; search (global vs current, default current)

**Endpoints:** `Cloud/List*`, `/Search`, `/User/StorageUsage`, `/Move`, `/Delete`, `/Update`, `/Directory`(create/rename/delete), `Cloud/Upload/*`, `Cloud/Documents`(create).
**Acceptance:** browse/upload/create/rename/move/delete/bulk all work with conflicts handled; large folders smooth; quota blocks cleanly.
**Risks:** multipart edge cases (abort/retry/idempotency); dnd file-drop vs move disambiguation; optimistic rollback correctness.

## Phase 4 — Preview + Share
**Objective:** preview modal + editing + versions + share.

- [ ] Preview modal + toolbar (download, share, delete, fullscreen, close); arrow-key nav
- [ ] Image (CDN `?w=&h=`, scaled-vs-original download), video, PDF
- [ ] Text/code editor (CodeMirror) with lock + heartbeat + draft + unsaved-changes guard
- [ ] Version history panel + restore (files + documents, doc diff)
- [ ] **Share** via `Cloud/PresignedUrl` (Web Share + copy link)

**Endpoints:** `Cloud/Find`,`/PresignedUrl`,`/Download`,`/Versions*`; `Cloud/Documents/Content`,`/Lock(+Heartbeat)`,`/Draft`,`/Versions(/Diff/Restore)`.
**Acceptance:** all four preview types open; editing respects locks/drafts; restore works; share copies a working URL.
**Risks:** lock contention (423) UX; draft throttle (429); CDN `?w=&h=` honored (infra `UNVERIFIED`).

## Phase 5 — Secure Folders
**Objective:** encrypted + hidden folders with the session-token lifecycle.

- [ ] Encrypted: create/convert/decrypt; unlock/lock; encrypted badge
- [ ] Hidden: hide/unhide; **`Shift Shift`** reveal; conceal
- [ ] In-memory token store (ancestor lookup, TTL re-prompt, explicit lock, clear-on-logout/tab-close)
- [ ] Instance header injection (`X-Folder-Session`/`X-Hidden-Session`)

**Endpoints:** `Cloud/Directory/Unlock`,`/Lock`,`/Encrypt`,`/Decrypt`,`/Hide`,`/Unhide`,`/Reveal`,`/Conceal`.
**Acceptance:** unlock/reveal flows work; tokens expire→re-prompt; logout/tab-close clears tokens; ancestor reuse works.
**Risks:** token never-persist guarantee; ancestor lookup correctness; 403 gating vs re-prompt loop.

## Phase 6 — Advanced
**Objective:** duplicate scan, archive, AV status, notifications inbox.

- [ ] Duplicate scan (start/status/result/cancel) with socket-first + poll; group UI + resolve
- [ ] Archive create + extract (+ preview, selective) with job progress
- [ ] AV status (pending/infected) gating on download/preview
- [ ] Notification inbox (history/unread/read/read-all) + toasts + quota warnings (80/90/100)

**Endpoints:** `Cloud/Scan/Duplicate/*`, `Cloud/Archive/*`, `Cloud/Scan/Status`, `Notification/*` + socket.
**Acceptance:** jobs show live progress + recover via poll; inbox + toasts consistent; AV/quota states enforced.
**Risks:** job lifecycle (cancel/missed events); socket reconnect correctness.

## Phase 7 — Public & Polish
**Objective:** public pages + cross-app polish.

- [ ] Landing, Features, Pricing ("coming soon")
- [ ] Responsive pass; accessibility (focus, keyboard, ARIA)
- [ ] Performance (code-split routes, lazy CodeMirror, image lazy + thumbnails, virtualization)
- [ ] Animation polish; full state-matrix coverage (empty/error/loading)
- [ ] SEO/metadata for public pages

**Endpoints:** `Subscription/My` (+ plan list if exposed).
**Acceptance:** public pages live; Lighthouse/perf budget met; a11y baseline; all surfaces have empty/error/loading.
**Risks:** scope creep in polish; pricing data source (open question).

## Phase 8 — Teams Integration (LAST)
**Objective:** turn on the team layer with zero refactor.

- [ ] `workspace.store` switcher (Personal ↔ Team); `X-Team-Id` end-to-end
- [ ] Team CRUD, members (roles), invitations (accept/decline/pending)
- [ ] Team storage/quota; CASL/role gating (permission-denied state for VIEWER)

**Endpoints:** `Team/*`, `Team/Members/*`, `Team/Invitations/*` (+ all `Cloud/*` under `X-Team-Id`).
**Acceptance:** switch context; everything personal-has works under a team; role permissions enforced.
**Risks:** query-key/cache invalidation on switch; permission matrix completeness.

---

### Global risks / dependencies
- API requires the OpenAPI spec reachable at generation time (`localhost:8080/swagger-json`).
- No backend **Share** (presigned-URL only), no **Trash** (design leaves room), **HMAC**/webhooks unverified — see DECISIONS.
- Bleeding-edge Next 16.2/React 19 + Auth.js v5 compatibility is the top early risk.
