# Claude Code — Initial Prompt (Planning Phase / NO CODE)

> Give this to Claude Code as the **first message**. Goal: without writing any code, have it deeply study the codebases and produce a **living roadmap + phased plan**.

---

You are a senior **frontend architect + technical planner**. We are rebuilding the frontend of a cloud-storage SaaS product (Google Drive / Yandex Disk style) as **v2**, from scratch. But **in this round you will not write a single line of application code.** This round is purely **exploration + planning**.

## 0) ABSOLUTE RULES

1. **Do NOT write application code.** This round produces only `.md` planning documents. No React components, hooks, stores, pages, or utils.
2. **Do NOT modify the API repo or the old frontend.** They are read-only sources. Your only writes are the planning documents in the v2 frontend repo (or a `docs/` folder you create there).
3. **Branch:** On the frontend, work on the `v2` branch. `main` is the old version; read it only as reference.
4. **No invention.** Verify every endpoint/model/behavior claim against real code and back it with **file paths**. Mark anything uncertain as "UNVERIFIED" and list it as an open question.
5. **The contract source of truth is the API repo** (controllers + Swagger/OpenAPI + generated client). The old frontend only answers "how was this contract consumed."
6. Follow existing conventions: model properties are **PascalCase**, use the OpenAPI-generated client, reuse existing folder/style patterns.
7. At the end of this round, **stop**: summarize findings + the phased plan + open questions, and wait for my approval. Do not start implementation without it.

## 0.5) LOCKED DECISIONS (obey these)

- **Design:** Built on shadcn/ui but aiming for a **premium / advanced** feel — smooth animation and transitions with `framer-motion` (page transitions, modal open/close, list entrances, hover/press micro-interactions). In Phase 0, design a **motion/animation system** (shared variants, duration/easing tokens, `prefers-reduced-motion` support); animation is part of the design system, not sprinkled on later. Use the **shadcn MCP** (available in Claude Code) to discover and add shadcn components/blocks/registries — don't hand-copy component source. The design-system plan should assume primitives are pulled in via the shadcn MCP and then customized for the premium look (don't fork them gratuitously).
- **Auth model:** Use a **session-based system** (session id via cookie / `X-Session-Id`, as in the old frontend's NextAuth credentials flow — no refresh token exposed to the client). The v2 scaffold currently contains only Next.js's default boilerplate, so **ignore its README** (any refresh-token / localStorage notes there do not apply).
- **MVP scope:** Finish the **Personal** layer end-to-end first. **Teams integration is the LAST phase.** So do not build team-switch UI in early phases; but architect everything (data fetching, query keys, the S3 "owner" concept, `X-Team-Id` injection) to be **team-ready** so adding it later needs no refactor.
- **Trash / recycle bin:** Does **not exist in the API yet** (planned later on the API side). So **not in MVP** — but design the delete UX so a future trash/restore can slot in without redesign.
- **Multi-select & bulk actions:** **Yes** — support selecting multiple items and bulk delete/move/download, plus drag-and-drop move into folders (`dnd-kit` is already a dependency).
- **Theme:** Provide a **light/dark** toggle (consider system preference).
- **i18n:** The app **will be internationalized and support two languages**, but the **MVP ships English only**. Set up the i18n structure now and author all UI copy via i18n keys (no hardcoded strings) even if only English exists at MVP.
- **Search scope:** Search can run **globally (all folders)** or **within the current folder**; the **user chooses**, and the **default is the current folder**. (The API search supports `path` + `extension` filters — verify.)
- **Notifications:** Use **unobtrusive toasts** for action feedback (success/error) that never interrupt the user, **and** provide a dedicated **notification inbox/panel with history** (backed by the socket.io gateway + stored history — verify the contract).
- **Pricing:** There will be a Pricing page but in a **"coming soon"** style — no full purchase/plan-management flow in MVP. Plan it as a page that showcases plans (from the subscription endpoint, if present) but shows a "coming soon" state instead of checkout.
- **Share:** Sharing logic **exists in the API** (confirmed by the user). NOTE: in a first pass, the old frontend's "share" appears to be only `navigator.share` + copy-download-URL-to-clipboard; no dedicated Share controller was clearly found. So **verify the real share endpoint(s) in the API repo** (controller/Swagger): path, request/response model, link expiry/permission/access semantics. Record findings in API-INVENTORY and FEATURE-MAP; if not found, flag as an open question.

## 0.6) API CLIENT & DATA LAYER (mandatory pattern)

The v2 project already includes an **`openapi-generator-cli`** setup that generates the API client and models from the backend's OpenAPI spec. This is the **single source of truth** for talking to the API — obey it everywhere:

- **All endpoints are called via the generated factories.** Never hand-write API calls or hit the backend with raw `axios`/`fetch`. (v1 pattern: `import { cloudApiFactory } from "@/Service/Factories"` → `cloudApiFactory.listVersions({ key })`.) You may wrap factory calls in typed hooks/services, but the underlying call **always** goes through a factory.
- **All request/response types come from the generated models.** Never duplicate or hand-roll DTOs the generator already produces. (v1 pattern: `import type { CloudObjectModel } from "@/Service/Generates/api"`.) If a type is missing or wrong, fix it at the spec/generation level — do not write a parallel type.
- **The generated client stays generated, never hand-edited** — treat the generated folder as build output. Plan the generation workflow in `ARCHITECTURE.md`: where the spec comes from, the generate script/config (`openapitools`), when to regenerate (whenever the API changes), and whether the output is committed.
- **Build a single, improved axios `Instance` layer** that all factories are constructed on. v1 had `Service/Instance.ts`; **do better than v1 — the design is yours.** It must centralize, at minimum:
  - base URL / env config;
  - **session auth** header injection (`X-Session-Id`; session-id model from §0.5);
  - **team-context** header injection (`X-Team-Id`) so the whole app is team-ready from day one (even though team UI ships last);
  - **secure-folder** header injection (`X-Folder-Session` / `X-Hidden-Session`) wired to the in-memory session store (§0.7.5);
  - **idempotency-key** handling for endpoints that require it (delete/move/upload);
  - the **response-envelope unwrap + typed-error/toast mapping** and **`401 → re-auth/sign-out`** from §0.7.3;
  - timeouts, retry/backoff, and request cancellation (`AbortSignal`) integrated with TanStack Query.
- Decide and document how this layer composes with TanStack Query (query-key strategy, where the unwrap boundary sits, how errors propagate to UI).

## 0.7) CROSS-CUTTING CONCERNS (plan these explicitly)

These are behavioral/architectural concerns that span many features. Treat each as a first-class planning item with its own coverage in `ARCHITECTURE.md` and `FEATURE-MAP.md`, and verify the backend contract for each. (Product-facing cross-cutting items — theme, i18n, search scope — are in Section 3.)

1. **Upload pipeline.** The API supports presigned URLs + multipart (create/complete/abort) with a max-upload-size and quota check. Plan the full UX: a persistent upload queue/tray with per-file progress, drag-and-drop **file** upload onto the storage area (distinct from drag-to-move), folder upload, pause/cancel/retry, concurrency limits, and behavior when a file exceeds the per-tier max size or the storage quota (block + clear message + upgrade hint).
2. **Conflict resolution.** Name clashes on upload/create/move/rename resolve via a strategy the API exposes (`FAIL` / `REPLACE` / `SKIP` / `KEEP_BOTH`). Plan a single reusable conflict-resolution dialog/pattern (with "apply to all" for bulk ops) instead of handling clashes ad hoc per action.
3. **API response envelope + error layer.** The backend wraps every response as `{ Result, Status }` (TransformInterceptor) and array endpoints carry a total-row-count. Plan one client layer (implemented in the §0.6 `Instance`) that unwraps `Result`, maps `Status`/HTTP errors to typed errors, drives toasts consistently, and centralizes `401 → re-auth/sign-out`. This is an architecture decision, not per-call handling.
4. **Real-time / socket lifecycle.** Notifications use a socket.io gateway (+ stored history). Plan the client socket lifecycle: authenticating the socket with the session, connect/disconnect on auth changes, reconnect/backoff, and how live events reach the UI — at minimum notifications, quota warnings (80/90/100%), and long-job progress (duplicate scan, archive create/extract). Decide polling-vs-socket per job type.
5. **Secure-folder session lifecycle.** Encrypted/hidden folders mint short-lived session tokens (`X-Folder-Session` / `X-Hidden-Session`, with a TTL) after passphrase unlock/reveal. Plan where tokens live (in-memory store, never persisted), the parent/ancestor folder lookup, TTL-expiry behavior (transparent re-prompt), explicit lock, and **clearing all tokens on logout / tab close**. Mirror the old `sessionManager` behavior but verify it.
6. **State matrix + AV/quota states.** Define the full per-surface state matrix beyond loading/empty/error: empty folder, no-search-results, network/server error, locked (encrypted, no session), reveal-required (hidden), **AV scan pending / infected** (block or warn on download), quota-warning vs quota-exceeded, and (later, for teams) permission-denied. Every list/preview/action maps to these.

**Engineering hygiene (optional — short section / can defer past MVP):** testing strategy (unit + component + e2e, and what's worth covering at MVP); lint/format/commit conventions + CI; SEO/metadata for the public pages (Next metadata API) + route-level error/suspense boundaries; performance budget (route code-splitting, lazy CodeMirror, image lazy-loading + thumbnail strategy, list virtualization via `@tanstack/react-virtual`).

## 1) CODEBASES (Context — three layers)

Detect the reachable repos yourself; the expected shape is:

- **API repo (NestJS)** — _contract source_. NestJS 11 + TS, PostgreSQL (TypeORM), MongoDB (audit), Redis (BullMQ + cache), S3 + CloudFront, ClamAV. Modules: `cloud, authentication, user, account, team, subscription, api, notification, document, health, mail`. **Read first:** `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/agents/*`, `.claude/agents/*`, and the controllers (`src/modules/**/**.controller.ts`).
- **Frontend `main` (old — reference)** — package name `storage-client`. Most features you'll plan are **already implemented** here. Mine it for behavior/UX/flows, but don't copy blindly (legacy). Key spots: `Service/Generates/` (OpenAPI client), `Service/Factories`, `Service/Instance.ts` (axios interceptors: `X-Team-Id` + `X-Folder-Session` injection), `components/Storage/*` (`FilePreviewModal`, `VersionHistoryPanel`, `imageCdn.ts`, `LazyPreview`, `FileIcon`, `BaseDialog`, `stores/encryptedFolders.store.ts`, `stores/hiddenFolders.store.ts`), `components/storage-browser/*` (grid/folder thumbnail, types), `features/teams/*` (`workspace.store`), `features/document-editor/*` (CodeMirror), `features/notifications/*` (socket.io), `hooks/useCloudList.ts`, `hooks/useAccountProfile.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/account/page.tsx`.
- **Frontend `v2` (clean target)** — package name `nextjs-storage`, Next 16.2 + React 19, a near-empty scaffold (default create-next-app boilerplate; **ignore its README**). **The new frontend is built here.** Write the planning docs here.

> Note: the old frontend stack (candidate tech for v2): Next App Router, NextAuth, TanStack Query, Zustand, shadcn/ui (new-york, neutral), Tailwind v4, axios + OpenAPI generated client, CodeMirror (text editing), `dnd-kit` (drag-and-drop), `framer-motion`, `qrcode.react` (2FA), `@simplewebauthn/browser` (passkey), `socket.io-client` (notifications), `react-hook-form` + `zod`, `sonner`, `@tanstack/react-virtual`.

## 2) EXPLORATION / INVESTIGATION LIST

Investigate in real code and record into the docs:

**A. API endpoint inventory** — module by module; for each endpoint: HTTP method + path, request/response models, auth type (session cookie / `X-Session-Id` vs API key `X-Api-Key`/`X-Api-Secret`), extra headers (`X-Team-Id`, `X-Folder-Passphrase`, `X-Folder-Session`, `X-Hidden-Session`, `Idempotency-Key`), CASL action/subject. At minimum:

- **Authentication:** `Login/Check → Login → Verify2FA`; `Passkey/Login/Begin → Passkey/Login/Finish` (bypasses 2FA); `Register`, `ResetPassword`, `Logout`.
- **Account / Security:** read/update profile, `ChangePassword`, 2FA setup/enable/disable + backup codes, Passkey management (register/list/delete), session list/revoke (for Account History).
- **Cloud:** `List`, `List/Breadcrumb`, `List/Directories`, `List/Objects`, `Find` (metadata), `PresignedUrl`, `Download` (stream + subscription-based throttle), `Delete`, `Move`, `Update` (rename/metadata), `Search`, `User/StorageUsage`, `Versions` (list), `Versions/Restore`, `Versions` (delete), `Scan/Status` (AV).
- **Share:** Find the real sharing endpoints in the API and extract their contract (create/list/revoke, link/permission/expiry, public access). See Section 0.5 — verify, don't assume.
- **Directory (encrypted + hidden):** encrypt / convert-to-encrypted / decrypt / unlock / lock; hide / unhide / reveal; rename; delete. Extract the passphrase + session-token (TTL) flow.
- **Documents:** `ReadContent` (+draft), `Find`, `ListVersions`, `RestoreVersion`, edit lock acquire/extend/release, draft save, lock status.
- **Archive (zip/extract):** create start/cancel, extract start/cancel, preview (BullMQ job + status polling).
- **Multipart upload:** create / complete / abort.
- **Duplicate scan:** start/status/result/cancel (SHA-256 + perceptual dHash, groups + similarity).
- **Subscription:** plan list, plan model (`StorageLimitBytes` 0=unlimited, `MaxObjectCount`, `Features`, `BillingCycle`, `Status`), user subscription.
- **Notification:** socket.io gateway events + history; quota warnings (80/90/100%), types.
- **API / Webhooks:** API key create/rotate/update, webhooks, quota/tier limits (HMAC).

**B. Storage model:** personal vs team distinction (`GetStorageOwnerId` → `user.Id` or `team/{teamId}`), context switch via `X-Team-Id`, path/breadcrumb structure, object/dir metadata (especially image `Width`/`Height`), image CDN size reduction via `?w=&h=`.

**C. Frontend conventions:** how the generated client is produced/wrapped, TanStack Query key patterns, Zustand store patterns, NextAuth setup + 2FA/passkey flow, axios `Instance` interceptors, shadcn/Tailwind v4 setup.

## 3) FEATURES TO COVER (Product Requirements)

The plan must cover **all** of these. Map each to screen(s) + component(s) + API endpoint(s) + states (loading/empty/error/permission).

**Public:** Landing, Features, Pricing **("coming soon" style** — see Section 0.5).

**Auth:** Register, Login (multi-step flow incl. 2FA + passkey + reset).

**Profile / Account:**

- Security: Change Password, Two-Factor Auth (setup + backup codes), Passkey Management & Login
- Subscription & Plan
- Account History (sessions/activity)

**Workspace (layer) switch — LAST PHASE:** Personal ↔ Teams. The user can see **everything** they see in Personal within a team layer too; switch between Personal and any team at will (`X-Team-Id`). Not in MVP; architect for it (see Section 0.5).

**Storage:**

- Always-visible **Usage** bar (percentage).
- Show files in both **List** and **Smart Grid** views.
- **Advanced filtering + sorting** system.
- **Preview**: image / video / text / PDF open in a modal + toolbar (download, **share — real endpoint**, delete, fullscreen, close).
- **Text files are editable** (CodeMirror; with the document lock + draft flow).
- At the bottom of the preview modal, **version history** + click to **restore** an old version.
- Images carry **width/height** metadata; rendered scaled via `?w=&h=`; download offers **two options: scaled vs original** (only for images that have metadata).
- While preview is open, navigate between previewable files with **left/right arrow keys**.
- On the storage page: **upload file**, **create file**, **create folder** buttons.
- When creating a folder, an **encrypt** option → password input → encrypted folder; encrypted folders appear marked in the list.
- **Hidden folders**: `Shift Shift` opens a dialog → entering the password reveals hidden folders matching that password.
- **Multi-select + bulk actions** (delete / move / download) and **drag-and-drop move** into folders.
- **Scan duplicates**, **notifications** (unobtrusive toasts + a notification inbox), **zip extraction** + **zipping**, and the other features present in the old frontend (mine and list them).

**Cross-cutting:** light/dark theme toggle; i18n structure (two languages planned, English-only at MVP, no hardcoded copy); search-scope selector (global vs current folder, default current folder).

## 4) PLANNING DOCUMENTS TO PRODUCE

Create all of these in the v2 frontend repo (e.g. `docs/`). Markdown.

1. **`ROADMAP.md`** — The main, **living** plan. Phase by phase (Phase 0 → Phase N). For each phase: objective, scope (in/out), task checklist (`- [ ]`), dependencies, API endpoints used, acceptance criteria, risks. Keep a short **Changelog** at the top.
2. **`API-INVENTORY.md`** — The endpoint catalog from Section 2A, mapped to features.
3. **`ARCHITECTURE.md`** — Proposed v2 frontend architecture: folder structure, state management, data fetching (query-key strategy), routing + folder-path deep-linking, design system (incl. the motion system), auth integration, **team-context** handling, real-time/socket lifecycle, generated-client strategy, theming, i18n, **plus the Section 0.7 concerns**: response-envelope/error layer, upload pipeline, conflict-resolution pattern, secure-folder session-token lifecycle, and the state matrix.
4. **`FEATURE-MAP.md`** — Each user-facing feature → screen/component → endpoint → states/edge cases.
5. **`DECISIONS.md`** — Open questions + decisions log (the locked decisions from Section 0.5 recorded as decided; new open questions added).
6. **`STATUS.md`** (or a section in ROADMAP) — progress tracking.

## 5) SUGGESTED PHASE STRUCTURE (refine it — updated per decisions)

> Order: **Personal end-to-end → Teams last.** Pricing "coming soon". Design: premium shadcn + framer-motion.

- **Phase 0 — Foundation + Design System:** repo setup, conventions, **premium shadcn + framer-motion motion system** (variant/easing/duration tokens, `prefers-reduced-motion`; pull shadcn primitives via the **shadcn MCP**), light/dark theming, i18n scaffolding (English-only at MVP), **generated client wiring (factories + models) + the improved axios `Instance`/data layer** (§0.6), **API response-unwrap + typed-error/toast layer** (§0.7.3), **socket.io client lifecycle** (auth + reconnect, §0.7.4), env, app skeleton + routing (folder-path deep-linking), providers (Query/Session/Notification). Architect **team-ready** but build no team UI.
- **Phase 1 — Auth:** register / login / 2FA / passkey / reset + session handling (session-id model).
- **Phase 2 — App Shell + Account (Personal):** app shell/navigation, Profile/Account (Security: Change Password / 2FA / Passkey, Subscription & Plan view, Account History). **No team switch.**
- **Phase 3 — Storage Core (Personal):** list/grid, breadcrumb, navigation, usage bar, **upload pipeline** (multipart + presigned, queue/progress tray, drag-and-drop file upload, folder upload, cancel/retry, concurrency, §0.7.1), create file/folder, delete/move/rename, multi-select + bulk actions + drag-and-drop move, **conflict-resolution dialog** (§0.7.2), and **quota-exceeded handling** (block + upgrade hint, §0.7.6).
- **Phase 4 — Preview + Share:** modal, image (w/h scaled + scaled/original download), video, PDF, text (CodeMirror + lock/draft), version history, arrow-key navigation, toolbar, **share (real endpoint)**.
- **Phase 5 — Secure Folders:** encrypted folders, hidden folders (`Shift Shift`), **session-token lifecycle** (in-memory store, ancestor lookup, TTL re-prompt, explicit lock, clear-on-logout/tab-close, §0.7.5).
- **Phase 6 — Advanced:** filter/sort, search (global vs current-folder selector), duplicate scan, archive (zip/extract + job progress), AV scan status (**pending / infected** handling, §0.7.6), notifications (toasts + inbox).
- **Phase 7 — Public & Polish:** Landing, Features, **Pricing ("coming soon")**, responsive, accessibility, performance, error/empty/loading states + animation polish.
- **Phase 8 — Teams Integration (LAST):** workspace store + personal/team switch, end-to-end `X-Team-Id` wiring, team CASL/role differences, member/invitation management, team storage & quota.

## 6) WORKFLOW (this round)

1. First read the convention/architecture docs (CLAUDE.md etc.), then explore (read-only).
2. Produce a short **findings summary** (what you found, how the three layers line up, which features already exist in the old frontend).
3. Write the planning docs (Section 4).
4. Produce **open questions** — the decisions in Section 0.5 are made and Section 0.7 is planned; ask about whatever remains (e.g., exact Share endpoint contract if unverified; the **default** conflict strategy [silent `KEEP_BOTH` vs always prompt the user]; pagination/virtualization expectations for large folders [`@tanstack/react-virtual` is available]; which file types each preview type must support; polling-vs-socket choice per long-running job). Ask me the 5–8 most critical ones and write them to `DECISIONS.md`.
5. Present the summary + phased plan + open questions and **stop**. Do not write code without approval.

> From here, we proceed as I say "implement Phase X" or "add/change Y in the ROADMAP." When updating ROADMAP, **don't rewrite it** — edit the relevant section and note it in the Changelog.
