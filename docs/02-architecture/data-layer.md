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

One instance, at **`service/Instance.ts`** (the path `factories.ts` already imports). It centralizes everything below so
hooks/components see plain typed data and never touch headers or the envelope.

### 2.1 Base / env
- `baseURL = NEXT_PUBLIC_API_URL + '/Api'`; sane timeouts; `withCredentials` for the session cookie.

### 2.2 Request interceptors (inject, in order)
1. **`X-Session-Id`** — from the Auth.js session (client) or the server token (RSC/route handlers).
2. **`X-Team-Id`** — from `workspace.store` (null/absent in Personal). **Team‑ready from day one.**
3. **Secure‑folder headers** — for `/Api/Cloud/*`, look up the request path in the in‑memory secure‑folder store and
   attach **`X-Folder-Session`** / **`X-Hidden-Session`** (ancestor‑aware). See
   [secure-folder-lifecycle](./secure-folder-lifecycle.md). (Hook point exists from Phase 0; store lands in Phase 5.)
4. **`Idempotency-Key`** — generate/attach for **Move / Delete / CompleteMultipartUpload** (stable per logical op).

### 2.3 Response interceptor (the envelope/error boundary)
- **Unwrap `Result`:** callers receive `data.Result`. Array endpoints surface `Result.Options.Count` for
  pagination/virtualization (kept accessible, e.g. on a meta channel or via a list wrapper).
- **Typed errors:** map `Status` / HTTP → `ApiError { code, messages, httpStatus, raw }`.
- **Toasts:** drive **sonner** consistently from `ApiError` (one place, not per call).
- **`401 → re-auth/sign-out`** centrally (mirrors the old `signOut`).
- **`403` and `409` pass through** to feature handlers (secure‑folder gating; conflict resolution) — they are *not*
  generic errors.

### 2.4 Cancellation & retry
- Thread `AbortSignal` from TanStack Query into the axios request.
- Bounded retry/backoff **for idempotent GETs only**; never auto‑retry mutations.

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
