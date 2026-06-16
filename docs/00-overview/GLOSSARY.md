# Glossary

> Shared vocabulary. When a term in any doc is ambiguous, this file wins. Terms are grouped, then alphabetical.

## Storage & ownership

- **Owner / `ownerId`** — the storage owner produced by the backend's `GetStorageOwnerId(user)`. It is **either**
  `user.Id` (Personal context) **or** `team/{TeamId}` (Team context). It is the S3 key prefix. **Never** treat it as a
  plain user UUID — that silently breaks team storage. (Backend rule; mirrored client‑side in query keys + headers.)
- **Personal context** — no active team; `ownerId = user.Id`; no `X-Team-Id` header.
- **Team context** — an active team selected; `ownerId = team/{TeamId}`; `X-Team-Id` header set. **MVP runs
  Personal‑only**, but all plumbing is team‑parameterized.
- **Key** — the storage object identifier/path used by `Cloud/*` endpoints (e.g. `Find`, `PresignedUrl`, `Download`).
- **Path** — the logical folder path used for listing/breadcrumbs (`Cloud/List`, `Delimiter`-based).
- **Usage / quota** — used bytes vs. plan limit (`Cloud/User/StorageUsage`); `StorageLimitBytes = 0` means unlimited.

## API shape

- **Envelope** — every non‑stream response is wrapped: `{ Result, Status: { Messages, Code, Timestamp, Path } }`. The
  client **unwraps `Result`** at the `Instance` boundary so components see plain typed data.
- **`Options.Count`** — array responses carry `Result.Options: { Skip, Take, Count, Search }`; `Count` drives
  pagination/virtualization.
- **Streaming response** — downloads bypass the envelope and stream binary (`Cloud/Download`).
- **Factory** — a generated API client object (e.g. `cloudApiFactory`) built on the shared `Instance`. The only
  sanctioned way to call the backend.
- **Model / DTO** — a generated request/response type (e.g. `CloudObjectModel`). Never hand‑rolled.
- **Instance** — the single axios instance all factories are built on; centralizes headers, idempotency, envelope
  unwrap, typed errors, `401→re-auth`, retries, cancellation. See [`../02-architecture/data-layer.md`](../02-architecture/data-layer.md).

## Auth & sessions

- **Session id** — the auth credential, carried via cookie `SESSION_COOKIE_NAME`, header **`X-Session-Id`**, or
  `Authorization: Bearer`. 7‑day TTL. **No refresh token is exposed to the client.**
- **Multi‑step login** — `Login/Check` (which methods + 2FA?) → `Login` (password) → `Verify2FA` (TOTP, called with the
  session id from step 2). The **passkey** path (`Passkey/Login/Begin`→`Finish`) **bypasses 2FA**.
- **Passkey** — WebAuthn credential (`@simplewebauthn/browser`), for passwordless login and as an account credential.
- **TOTP / 2FA** — time‑based one‑time password (`qrcode.react` for setup) with **backup codes** shown once.

## Secure folders

- **Encrypted folder** — a folder created/converted with a passphrase (≥ 8 chars). Locked by default; unlocking mints a
  **folder session token**.
- **Hidden folder** — a folder concealed from listings; revealed via the global **`Shift Shift`** passphrase dialog,
  which mints a **hidden session token**.
- **Folder session token** — `X-Folder-Session`; minted by `Directory/Unlock`; base64, folder‑scoped, TTL‑bound,
  **ancestor‑applicable** (a parent's token covers children).
- **Hidden session token** — `X-Hidden-Session`; minted by `Directory/Reveal`; same properties.
- **`X-Folder-Passphrase`** — the request header (min 8) sent on unlock/reveal/encrypt/decrypt/hide/unhide ops; mints a
  token. **Never stored**; tokens (also never persisted) replay it for subsequent calls.
- **Ancestor lookup** — resolving the nearest unlocked ancestor's token for a deep path, so you don't re‑prompt per
  subfolder.

## Cross‑cutting behavior

- **Conflict strategy** — how a name clash resolves: `FAIL` / `REPLACE` / `SKIP` / `KEEP_BOTH`. v2 default = **prompt the
  user** with one reusable dialog, **apply‑to‑all** for bulk. See [`../02-architecture/conflict-resolution.md`](../02-architecture/conflict-resolution.md).
- **Idempotency key** — `Idempotency-Key` header on Move/Delete/CompleteMultipartUpload; makes retries safe (Redis 24h
  on the backend).
- **Multipart upload** — large‑file upload split into parts: `CreateMultipartUpload` → `GetMultipartPartUrls` (presign) →
  PUT parts → `CompleteMultipartUpload` / `Abort`.
- **Presigned URL** — a time‑limited direct S3 URL (`Cloud/PresignedUrl`); the basis of MVP download **and** "Share".
- **Duplicate scan** — async job (SHA‑256 + perceptual dHash) producing groups + similarity + potential savings.
- **Archive job** — async zip/extract (BullMQ) with progress via socket + polling fallback.
- **Quota warning** — socket events at **80 / 90 / 100%** usage (`QUOTA_WARNING` / `QUOTA_EXCEEDED`).
- **State matrix** — the full set of per‑surface states beyond loading/empty/error (locked, reveal‑required, quota
  warning/exceeded, permission‑denied). See [`../02-architecture/state-matrix.md`](../02-architecture/state-matrix.md).

## Frontend stack terms

- **TanStack Query** — server‑state cache; **query keys** are namespaced and **team‑prefixed**.
- **Zustand** — client/UI state stores (workspace, secure folders, upload queue, selection, ui).
- **shadcn MCP** — the tool used to discover & add shadcn primitives/blocks (don't hand‑copy component source).
- **Motion tokens / variants** — shared `framer-motion` durations/easings and reusable animation variants; gated by
  **`prefers-reduced-motion`**.
- **Route group** — App Router `(public)` / `(auth)` / `(app)` segment grouping with per‑group layouts.
- **Deep‑linking** — folder path encoded in the URL via `storage/[[...path]]` catch‑all; preview deep‑linkable too.
