# Data Layer — generated client + axios `Instance` + envelope/error

> The single most important architectural piece. Every byte to/from the backend flows through here.
> Conventions: [`../00-overview/CONVENTIONS.md`](../00-overview/CONVENTIONS.md#2-data-access) ·
> Contract: [`../05-api/API-INVENTORY.md`](../05-api/API-INVENTORY.md).

## 1. Generated client strategy

- **Spec source:** the API's OpenAPI at `http://localhost:8080/swagger-json` (config in `openapitools.json`).
  Generator **`typescript-axios` 7.17.0**, output `service/generates`, `modelPackage:"dto"`,
  `useSingleRequestParameter:true`, `withInterfaces:true`, `supportsES6:true`, `skipValidateSpec:true`.
- **Command:** `npm run generate:service:test`. Regenerate **whenever the API changes**.
- **The generated folder is committed and treated as build output — never hand‑edited.** If a type is wrong, fix the
  spec/generation, not the output.
- **Rule:** every call goes through a generated **factory**; every DTO is a generated **model**. No raw `fetch`/`axios`;
  no hand‑rolled DTOs. Typed hooks/services wrap factories, but the underlying call is always a factory.

### Factories
`service/factories.ts` constructs each factory on the shared `Instance`. **Currently wired (11):** Authentication,
AccountSecurity, Account, Cloud, CloudDirectory, CloudUpload, CloudArchive, CloudDocuments, Team, TeamInvitations,
TeamMembers. **Add in Phase 0 if the spec exposes them:** Subscription, Notification.

```ts
// shape (existing)
export const cloudApiFactory = CloudApiFactory(undefined, undefined, Instance);
```

## 2. The axios `Instance` ("do better than v1")

One instance, at **`service/Instance.ts`** (the path `factories.ts` already imports). It is a **~30‑line composer** —
no business logic inline. Each concern lives in its own file under
**`service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts`** and is independently testable. The
composer's job is to construct the axios client, register the interceptors in order, and export it. Hooks/components
see plain typed data and never touch headers or the envelope.

### 2.1 Base / env
- `baseURL = NEXT_PUBLIC_API_URL + '/Api'`; sane timeouts; `withCredentials` for the session cookie.

### 2.2 Request interceptors (registered, in order)
Each bullet is a separate file under `service/interceptors/`. The composer wires them; nothing here knows about the
others.
1. **`session.ts`** — injects **`X-Session-Id`** — reads from the token‑sources seam (see §2.6), which resolves to the
   Auth.js session on the client or the server token in RSC/route handlers.
2. **`team.ts`** — injects **`X-Team-Id`** — reads from the token‑sources seam (backed by
   `stores/workspace.store.ts`). Null/absent in Personal. **Team‑ready from day one.**
3. **`secure-folder.ts`** — for `/Api/Cloud/*`, looks up the request path via the token‑sources seam and attaches
   **`X-Folder-Session`** / **`X-Hidden-Session`** (ancestor‑aware). See
   [secure-folder-lifecycle](./secure-folder-lifecycle.md). The interceptor file ships from Phase 0 with a no‑op
   getter; Phase 5 registers the real getter from `features/secure-folders/`.
4. **`idempotency.ts`** — attaches **`Idempotency-Key`** for **Move / Delete / CompleteMultipartUpload** (stable per
   logical op). Keys are produced by `lib/api/idempotency.ts` (see §2.7) so call sites can pre‑mint the same key.
   Replay semantics and recovery rules in §2.8.

### 2.3 Response interceptor (the envelope/error boundary)
Lives in **`service/interceptors/envelope.ts`** — the single response interceptor registered by the composer.
- **Unwrap `Result`:** callers receive `data.Result`. Array endpoints surface `Result.Options.Count` for
  pagination/virtualization (kept accessible, e.g. on a meta channel or via a list wrapper).
- **Typed errors:** map `Status` / HTTP → `ApiError { code, messages, httpStatus, raw }` from `lib/api/ApiError.ts`.
- **Toasts:** drive **sonner** consistently from `ApiError` via `lib/api/error-toast.ts` (one place, not per call).
- **`401 → re-auth/sign-out`** centrally (mirrors the old `signOut`).
- **`403` and `409` pass through** to feature handlers (secure‑folder gating; conflict resolution) — they are *not*
  generic errors.

### 2.4 Interceptor execution model
Axios runs **request interceptors in reverse registration order** and **response interceptors in registration order**.
The composer registers, in this order: **envelope** (response), **idempotency** (request), **secure‑folder** (request),
**team** (request), **session** (request). The resulting on‑the‑wire request flow is therefore:

```
session → team → secure-folder → idempotency → envelope (response)
```

| Interceptor      | Phase    | Sync/Async | Source of truth                          |
|------------------|----------|------------|------------------------------------------|
| `session`        | request  | sync       | `getSessionSource()` (token‑sources)     |
| `team`           | request  | sync       | `getTeamSource()` (token‑sources)        |
| `secure-folder`  | request  | sync       | `getSecureFolderTokenSource(path)`       |
| `idempotency`    | request  | sync       | request config (pre‑minted by call site) |
| `envelope`       | response | **async**  | response body + `signOut()` on 401       |

- All four request interceptors are **synchronous header‑add ops** — they read from token‑sources getters and attach a
  header. No I/O, no awaits.
- **Envelope is the only async interceptor** because it `await`s `signOut()` on `401` before propagating the error.
- **Any interceptor that throws aborts the pipeline** — the error bubbles to the factory caller as `ApiError`. Request
  interceptors throw on missing required tokens; the response interceptor throws on non‑success envelopes.

### 2.5 Envelope unwrap strategy
The backend wraps every response as `{ Success, Data, Errors, Count? }`. The envelope interceptor **unwraps `Data`
(or throws `ApiError`) before returning to the factory caller** — feature code never sees the wrapper.

| Endpoint shape       | Wire body                                  | What the factory returns                 |
|----------------------|--------------------------------------------|------------------------------------------|
| Singular             | `{ Success, Data: T, Errors }`             | `T` (not `Result<T>`)                    |
| Array (with `Count`) | `{ Success, Data: T[], Errors, Count }`    | `{ items: T[], count?: number }`         |
| Error                | `{ Success: false, Errors: [...] }`        | throws `ApiError`                        |

Implementation lives in **`lib/api/envelope.ts`** as `unwrapEnvelope<T>`, **overloaded on array vs singular** so call
sites get the right shape without runtime branching at the feature layer.

```ts
// lib/api/envelope.ts (shape)
export function unwrapEnvelope<T>(body: Envelope<T>):  T;
export function unwrapEnvelope<T>(body: Envelope<T[]>): { items: T[]; count?: number };
```

**Rule:** feature hooks **never read `.Data` or `.Errors`**. If you see either at a call site, the unwrap boundary has
leaked — fix the interceptor, not the call site.

### 2.6 Token‑sources seam (inverted deps)
`service/` is a **leaf** — it must never import from `@/features/*`. The seam that makes this work is
**`service/token-sources.ts`**: a tiny module that exposes setters and getters for the three runtime values the
interceptors need.

```ts
// service/token-sources.ts (shape)
export const registerSessionSource        = (get: () => string | null) => { /* ... */ };
export const registerTeamSource           = (get: () => string | null) => { /* ... */ };
export const registerSecureFolderTokenSource = (
  get: (path: string) => { folder?: string; hidden?: string } | null,
) => { /* ... */ };
```

- The interceptors **import getters** from this file — they never reach into `stores/` or `features/`.
- **`app/providers.tsx`** is the single place that **registers** the real sources at runtime: session from Auth.js,
  team from `stores/workspace.store.ts`, secure‑folder token from `features/secure-folders/`. Until a source is
  registered the getter returns `null` and the interceptor is a no‑op.
- This is what keeps the ESLint `boundaries` graph one‑way while still letting feature state drive request headers.

### 2.7 Helpers (`lib/api/`)
Cross‑cutting primitives that the Instance composer and feature hooks both consume.

- **`lib/api/idempotency.ts`** — `newIdempotencyKey()` returns a **UUID v7**. Single source of truth; mutations
  (Move / Delete / CompleteMultipartUpload) mint a key at the call site and pass it through so retries and optimistic
  rollbacks reuse the same key. The `idempotency` interceptor reads it from the request config. Replay semantics in §2.8.
- **`lib/api/envelope.ts`** — `unwrapEnvelope<T>` (overloaded; see §2.5). The envelope interceptor is the only caller;
  feature hooks never import it.
- **`lib/api/abort.ts`** — `composeSignals(...signals)` merges TanStack Query's signal with feature‑owned aborts
  (e.g. unmount, debounced search supersede); `withTimeout(signal, ms)` for bounded waits. Queries thread the
  composed signal into the factory call.
- **`lib/api/pagination.ts`** — cursor/page helpers (extract `Options.Count`, build next‑page params, normalize
  cursor shapes) used by list hooks and infinite queries.

Rules of thumb: **mutations import `idempotency.ts`**; **queries thread `AbortSignal` via `abort.ts`**; list hooks
reach for `pagination.ts` instead of re‑deriving the shape.

### 2.8 `Idempotency-Key` replay window & recovery
**Move**, **Delete**, and **CompleteMultipartUpload** mint a **UUID v7** key via `lib/api/idempotency.ts`
`newIdempotencyKey()`. The backend honors a **24‑hour replay window** keyed by `(user, key, endpoint)`.

| Scenario                                  | Key behavior                | Backend response                                  |
|-------------------------------------------|-----------------------------|---------------------------------------------------|
| Network fail mid‑request → retry          | **same key**                | recognizes replay, returns the original response  |
| Backend 5xx → retry                       | **same key** (allowed)      | re‑executes or returns cached success             |
| Client crash + restart                    | key lost → **new key**      | treated as a fresh op                             |
| Replay within 24h with a **different body** | same key, different payload | **`409` `ApiError.code = IDEMPOTENCY_CONFLICT`**  |
| Replay **after** 24h                      | same key, fresh window      | treated as a fresh op                             |

**Call‑site rule:** feature hooks call `newIdempotencyKey()` **once per logical op** and pass the same key through every
retry path (TanStack Query retry, manual user re‑try, optimistic rollback). Re‑minting per attempt defeats the guarantee.

**Recovery UX:**
- **Uploads** — the IndexedDB upload queue persists the key alongside the part list so a resumed
  `CompleteMultipartUpload` after reload reuses the same key (still inside the 24h window).
- **Mutation `409 IDEMPOTENCY_CONFLICT`** — surface as **"Same operation already in progress"** and re‑poll the
  affected list query; do not auto‑retry.

### 2.9 Retry strategy
Retries are owned by **TanStack Query**, not axios. We **do not** use `axios-retry`. The envelope interceptor **never
retries** — it only unwraps, maps, and throws.

| Surface                          | Retries                          | Backoff           | Notes                                                  |
|----------------------------------|----------------------------------|-------------------|--------------------------------------------------------|
| Queries (default)                | **2** on 5xx + network errors    | exp **1s, 2s**    | **No retry on 4xx**                                    |
| Mutations (default)              | **0**                            | —                 | User re‑submits explicitly                             |
| Move / Delete / CompleteMultipart | **opt‑in** `retry: 2`            | exp **1s, 2s**    | Safe only because of the §2.8 idempotency key          |
| Envelope interceptor             | **never**                        | —                 | Maps `ApiError` and throws; retry is a query concern   |

**Rule:** a mutation that opts into retry **must** mint and reuse an idempotency key per §2.8. Mutations without a key
**never** auto‑retry.

## 3. The request lifecycle (full)

```
component
  └─ useQuery/useMutation                         (TanStack Query: key, signal, optimistic)
       └─ typed hook  (features/*/hooks)
            └─ factory(request, { signal })       (generated, on Instance)
                 └─ Instance.request
                      REQUEST  → +X-Session-Id +X-Team-Id +folder/hidden +Idempotency-Key
                      RESPONSE → unwrap Result
                                 ├─ ok    → plain typed Result  ───────────► hook → component
                                 └─ error → ApiError
                                              ├─ 401 → re-auth/sign-out
                                              ├─ 403/409 → throw (feature handles)
                                              └─ else → toast + throw
```

## 4. How it composes with TanStack Query
- The **unwrap boundary is the Instance** — Query caches already‑unwrapped typed data.
- Query keys are **team‑prefixed**; mutations are optimistic where it matters with centralized invalidators. See
  [state-management](./state-management.md).
- Long‑running jobs are **not** Query resources — they're socket‑fed job stores with a polling‑fallback query. See
  [realtime-socket](./realtime-socket.md).

## 5. Edge cases & rules
- **Streaming downloads** (`Cloud/Download`) bypass the envelope (binary). Don't run them through the unwrap path.
- **Presigned PUTs to S3** during upload are **not** backend calls — they don't get the envelope or the auth headers.
  Keep them on a separate axios call (or `fetch`) outside the `Instance`'s interceptors. (The only sanctioned non‑factory
  network calls in the app; documented here so it's not mistaken for breaking the "factories only" rule.)
- **Server vs client:** in RSC/route handlers, the session id comes from the server session, not the browser cookie
  context — the `Instance` must support both.

## 6. Open items
- Confirm whether `Subscription`/`Notification` factories exist in the generated client or need spec exposure (Phase 0).
- Confirm the exact mechanism to surface `Options.Count` to list hooks (meta channel vs wrapper) — decide in Phase 3.
- **Prefetch placement** — do per‑feature prefetch helpers live in `features/<f>/api/<f>.queries.ts` (`prefetch<Resource>(qc, params)`)
  or in a sibling `<f>.server.ts` marked `import 'server-only'`? Server‑only would make RSC prefetch unambiguous but
  splits the surface. Decide before Phase 2.
- **Middleware matchers** — Auth.js v5 single `proxy.ts` matcher vs per‑segment guards in
  `app/(app)/layout.tsx` / `app/(auth)/layout.tsx`. Affects how `lib/auth/proxy.ts` is shaped behind the
  5‑line root shim. Decide in Phase 1.
