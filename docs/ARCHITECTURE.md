# ARCHITECTURE.md

> Proposed **v2 frontend** architecture for `nextjs-storage` (Next 16.2 / React 19). This is a plan, not code.
> It encodes INIT.md §0.5 (locked decisions), §0.6 (API/data layer), and §0.7 (cross-cutting concerns), grounded
> in the old frontend's working patterns and the API contract ([API-INVENTORY.md](./API-INVENTORY.md)).
>
> ⚠ **Before writing any Phase-0 code, read `node_modules/next/dist/docs/01-app/`** — AGENTS.md warns this Next
> version has breaking changes vs. training data.

---

## 1. Tech stack (target)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next 16.2 (App Router), React 19 | read bundled docs first |
| Data fetching | **TanStack Query v5** | server cache, query keys, cancellation |
| Client state | **Zustand** | UI/session stores (workspace, secure-folder, upload queue, selection) |
| HTTP | **axios** + generated `typescript-axios` client | single `Instance` (§4) |
| Auth | **Auth.js v5 (NextAuth)** credentials | session-id flow, no refresh token to client |
| Design | **shadcn/ui** (new-york, neutral) via **shadcn MCP** + **Tailwind v4** | premium customization |
| Motion | **framer-motion** | shared variant/token system (§7) |
| Forms | **react-hook-form** + **zod** | |
| DnD | **dnd-kit** | move-into-folder + (distinct) file-drop upload |
| Realtime | **socket.io-client** | `/notifications` namespace |
| Toasts | **sonner** | + notification inbox |
| Editor | **CodeMirror 6** | text/code editing |
| Virtualization | **@tanstack/react-virtual** | large folders/lists |
| i18n | lightweight dictionary (EN at MVP) | structure now, no hardcoded copy |
| 2FA/passkey | **qrcode.react**, **@simplewebauthn/browser** | |

## 2. Folder structure (proposed)

```
app/                         # routes (App Router)
  (public)/                  # landing, features, pricing  — public layout
  (auth)/                    # login, register, reset       — auth layout
  (app)/                     # authenticated shell
    storage/[[...path]]/     # folder deep-linking (catch-all)
    account/                 # profile, security, sessions, subscription
  api/auth/[...nextauth]/    # Auth.js route handler
lib/
  api/                       # Instance.ts, error mapping, envelope unwrap, query-keys
  auth/                      # session helpers, nextauth config
  i18n/                      # dictionaries + t()
  motion/                    # variants, tokens, reduced-motion
  utils/
service/
  factories.ts               # generated factories on Instance (exists)
  generates/                 # GENERATED — never hand-edit (exists, committed)
features/
  storage/                   # browser (list/grid), upload, conflict, secure-folders, duplicate, archive
  preview/                   # FilePreviewModal, version history, image CDN
  document-editor/           # CodeMirror + lock/draft/diff
  notifications/             # socket provider + inbox
  account/ auth/ teams/      # teams = last phase, scaffolded but inert
components/ui/               # shadcn primitives (via MCP) + premium wrappers
stores/                      # zustand: workspace, secureFolders, uploads, selection, ui
hooks/                       # useCloudList, useAccountProfile, …
```

## 3. Generated client strategy (§0.6)

- **Spec source:** API OpenAPI at `http://localhost:8080/swagger-json` (config in `openapitools.json`). Generator
  `typescript-axios` 7.17.0, output `service/generates`, `modelPackage:"dto"`, `useSingleRequestParameter`, `withInterfaces`.
- **Regenerate:** `npm run generate:service:test` whenever the API changes. **Output is committed** and treated as
  build artifact — **never hand-edit**. If a type is wrong, fix the spec/generation, not the output.
- **Rule:** every call goes through a generated **factory**; every DTO is a generated **model**. No raw `fetch`/`axios`,
  no hand-rolled DTOs. Typed hooks/services wrap factories but the underlying call is always a factory.
- `service/factories.ts` constructs the 12 factories on the shared `Instance` (mirrors old `Service/Factories.ts`).

## 4. The axios `Instance` / data layer (§0.6 — "do better than v1")

A single `lib/api/Instance.ts` all factories are built on. Centralizes:

1. **Base/env:** `baseURL = NEXT_PUBLIC_API_URL` + `/Api`; sane timeouts.
2. **Auth header:** inject **`X-Session-Id`** from the Auth.js session (client) / server token for RSC/route handlers.
3. **Team context:** inject **`X-Team-Id`** from `workspace.store` (null in Personal) — **team-ready from day one**.
4. **Secure-folder headers:** for `/Api/Cloud/*` calls, look up the path in the in-memory secure-folder store and inject
   **`X-Folder-Session`** / **`X-Hidden-Session`** (ancestor-aware) — see §10.
5. **Idempotency:** generate/attach **`Idempotency-Key`** for Move/Delete/CompleteMultipartUpload (stable per logical op).
6. **Response envelope unwrap:** response interceptor returns `data.Result` to callers; array `Options` (Count) surfaced
   for pagination. The unwrap boundary lives here so hooks/components see plain typed data.
7. **Typed errors + toast:** map `Status`/HTTP to a typed `ApiError { code, messages, httpStatus, raw }`; drive sonner
   toasts consistently; **`401 → re-auth/sign-out`** centrally (mirrors old `signOut`). 403/409 pass through to feature
   handlers (encrypted-folder gating, conflict resolution).
8. **Cancellation/retry:** thread `AbortSignal` from TanStack Query; bounded retry/backoff for idempotent GETs only.

```
component ── useQuery/useMutation ──> typed hook ──> factory(req, {signal}) ──> Instance
                                                                                  │  request:  +session +team +folder +idem
   plain typed Result  <───────────────────────────────────────────────────────┘  response: unwrap Result / throw ApiError → toast / 401→signOut
```

## 5. TanStack Query strategy

- **Query-key namespaces** (carry over old shape): `['cloud','list',path,delimiter,flags]`, `['cloud','objects',…]`,
  `['cloud','directories',…,hiddenToken]`, `['cloud','breadcrumb',path]`, `['account','profile']`,
  `['subscription','my']`, `['notifications','unreadCount']`, `['document','content',key]`, etc.
- **Team scoping:** prefix keys with the active team id (or `'personal'`) so switching `X-Team-Id` invalidates cleanly
  later — no refactor when Teams ship.
- **Secure-folder tokens in keys:** include the hidden/folder token so revealing/unlocking re-fetches.
- **Mutations:** optimistic for delete/move/rename with rollback; targeted `invalidate*` helpers per surface
  (mirror `useCloudList`'s invalidators). Long jobs (archive/duplicate) are **not** queries — they're job stores fed by
  socket events (§9), with a polling fallback query.
- **Unwrap boundary** is the Instance (§4.6); list pagination reads `Options.Count` for virtualization/infinite scroll.

## 6. Routing & deep-linking

- `app/(app)/storage/[[...path]]/page.tsx` catch-all maps URL segments ↔ folder path (the API's `Path`/`Delimiter`).
  Breadcrumb from `Cloud/List/Breadcrumb`. Preview opens as an **intercepting/parallel route or modal** keyed by file
  key so it's deep-linkable and arrow-nav works. Search scope (global vs current folder) is a query param; default
  current folder.
- Route-level `loading.tsx`/`error.tsx` boundaries per segment for suspense + error states (§12 matrix).

## 7. Design system + motion (premium shadcn + framer-motion)

- **Primitives via shadcn MCP** (don't hand-copy): pull components/blocks, then wrap in `components/ui/*` for the premium
  look. Tailwind v4 tokens in `globals.css` (`@theme inline`); extend the existing `--background/--foreground` to a full
  semantic palette (surfaces, borders, accent, states).
- **Motion is part of the system, not sprinkled on.** `lib/motion/`:
  - **Tokens:** durations (`fast 120ms / base 200ms / slow 320ms`), easings (standard/decelerate/accelerate spring),
    distances.
  - **Shared variants:** page transition, modal open/close (scale+fade), list entrance (stagger), hover/press
    micro-interactions, toast.
  - **`prefers-reduced-motion`:** a `useReducedMotion` gate that swaps variants for instant/opacity-only — required, not
    optional.
- Theming: light/dark toggle with system preference (next-themes-style), tokens drive both.

## 8. Auth integration (Auth.js v5, session-id model)

- Credentials provider wraps the **multi-step** flow: `Login/Check` → `Login` (→ `Verify2FA` if `RequiresTwoFactor`,
  called with `X-Session-Id`) and the **passkey** path (`Passkey/Login/Begin`→`Finish`, bypasses 2FA). JWT stores
  `sessionId/expiresAt/requiresTwoFactor`; session callback fetches `Account/Profile`. **No refresh token to the client.**
- `signOut` revokes server-side (`Authentication/Logout`) and **clears all secure-folder tokens** (§10) and team context.
- **Risk:** verify Auth.js v5 + Next 16.2/React 19 compatibility early in Phase 0; fall back to a thin custom
  cookie-session adapter if blocked (recorded in DECISIONS).

## 9. Real-time / socket lifecycle (§0.7.4)

- One socket to namespace **`/notifications`**, auth `{ SessionId }` in the handshake; `withCredentials`, websocket
  transport, reconnect with backoff (cap ~30s). Connect on authenticated session, **disconnect/reconnect on auth or
  team change**, teardown on sign-out.
- A `NotificationProvider` fans `notification` events to: (a) **sonner toasts** by `NotificationType` (errors/warnings/
  success; progress types stay silent), (b) the **inbox** store + `['notifications']` query invalidation, (c) **job
  stores** (archive/duplicate progress), (d) **quota** warnings (80/90/100%).
- **Per-job transport (decided): socket-first + polling fallback.** Job hooks subscribe to socket progress; if the
  socket is down/missing an event, a low-frequency `…/Status` poll reconciles. Notifications/quota are socket + the REST
  inbox for history.

## 10. Secure-folder session-token lifecycle (§0.7.5)

- **Store:** in-memory (`stores/secureFolders`), **never persisted** (no localStorage). Two logical namespaces:
  encrypted (`X-Folder-Session`) and hidden (`X-Hidden-Session`). Path-*marks* (which folders are encrypted/hidden) may
  persist to `sessionStorage`; **tokens never do**.
- **Mint:** `Directory/Unlock` (passphrase) → folder token; `Directory/Reveal` (passphrase) → hidden token. Store
  `{ token, expiresAt }` keyed by the returned root folder path.
- **Lookup:** ancestor-aware — a request for `a/b/c` uses the nearest ancestor's valid token (mirror old `SessionManager`).
- **Injection:** the Instance (§4.4) attaches the right header for `/Api/Cloud/*` calls based on the request path.
- **TTL expiry:** transparent re-prompt (passphrase dialog) when a token is expired/missing and a 403 indicates locked/
  hidden. **Explicit lock/conceal** (`Directory/Lock`, `/Conceal`) clears tokens. **Clear ALL on logout / tab close**
  (`beforeunload` + sign-out).
- **Hidden reveal UX:** global **`Shift Shift`** opens a passphrase dialog → `Reveal` → hidden dirs matching that
  passphrase appear (token folded into `directories` query key).

## 11. Upload pipeline (§0.7.1)

- **Persistent queue/tray** (zustand) with per-file state + progress, concurrency limit, pause/cancel/retry.
- **Flow:** `CreateMultipartUpload` (pre-flight size/quota) → `GetMultipartPartUrls` (batch presign) → PUT parts directly
  to S3 (or `UploadPart` proxy) with per-part progress → `CompleteMultipartUpload` (`Idempotency-Key`) / `Abort` on cancel.
- **Two distinct drops:** drag **file** onto storage area = upload; drag **item** onto folder = move (dnd-kit). Folder
  upload supported (recurse into create-dir + uploads).
- **Limits:** if `TotalSize > MaxUploadSizeBytes` or quota exceeded → block with a clear message + upgrade hint
  (no silent failure). Conflicts route through the conflict pattern (§13).

## 12. Response-envelope + error layer (§0.7.3)

Implemented in the Instance (§4.6–4.7): unwrap `Result`, map `Status`/HTTP → typed `ApiError`, consistent toasts,
central `401→re-auth`. Features opt into 403 (secure-folder gating) and 409 (conflict) handling. One place, not per-call.

## 13. Conflict-resolution pattern (§0.7.2) — **decided: prompt + apply-to-all**

A single reusable dialog/hook resolves `FAIL/REPLACE/SKIP/KEEP_BOTH` for upload/create/move/rename. On 409
(`ConflictDetailsResponseModel`) it prompts; bulk ops offer **"apply to all"** and remember the choice for the batch.
No silent overwrites by default.

## 14. State matrix (§0.7.6)

Every list/preview/action surface maps to these states (not just loading/empty/error):

| State | Trigger | UX |
|---|---|---|
| Loading | query pending | skeletons (motion-aware) |
| Empty folder | 0 items | empty illustration + primary actions |
| No search results | search → 0 | "no results" + clear/broaden scope |
| Network/server error | transport/5xx | retry affordance |
| Locked (encrypted) | 403 / no folder session | passphrase prompt (unlock) |
| Reveal-required (hidden) | hidden, no hidden session | `Shift Shift` reveal prompt |
| AV pending | `Scan/Status` pending | badge; downloads gated/warned |
| AV infected | `Scan/Status` infected | block or warn-on-download |
| Quota warning | 80/90% (socket) | banner/toast + upgrade hint |
| Quota exceeded | 100% / pre-flight block | block upload + clear message + upgrade |
| Permission denied | (Teams, later) CASL 403 | disabled actions + explanation |

## 15. Team-readiness (build for, ship last)

All data fetching is team-parameterized (query keys + `X-Team-Id` injection), storage "owner" concept respected
(`user.Id` vs `team/{id}`). **No team-switch UI in MVP**; `workspace.store` exists but stays Personal-only until Phase 8.

## 16. Engineering hygiene (can defer past MVP)

Testing (unit + component for the Instance/stores/hooks; a couple of e2e happy paths), lint/format/commit + CI,
SEO/metadata for public pages (Next metadata API) + route error/suspense boundaries, performance budget (route
code-splitting, lazy CodeMirror, image lazy-load + thumbnail strategy, list virtualization).
