# Upload Pipeline

> Resilient multipart/presigned uploads with a persistent queue/tray. The heaviest task in
> [Phase 3](../01-roadmap/phases/phase-3-storage-core.md). API: [cloud-upload](../05-api/modules/cloud-upload.md).

## 1. Queue / tray (Zustand `uploads` store)

A **persistent tray** with per‑file state and progress, independent of which folder the user is viewing:

- Per‑file: `{ id, name, size, key, uploadId, parts[], progress, status }` where status ∈
  `queued | presigning | uploading | completing | done | error | canceled | paused`.
- **Concurrency limit** across files (and across parts within a file).
- **Pause / cancel / retry** per file; cancel aborts the multipart upload server‑side.

## 2. Flow

```
CreateMultipartUpload(Key, TotalSize, ContentType?, Metadata?, ConflictStrategy?)
   │  backend PRE-CHECKS:  TotalSize > MaxUploadSizeBytes → 400
   │                       Used + TotalSize > StorageLimit → 400
   └─► UploadId, Key
GetMultipartPartUrls(Key, UploadId, TotalParts|PartNumbers)      → [{ PartNumber, Url, Expires }]
   └─► PUT each part directly to S3 (presigned)  — OR  UploadPart proxy (≤10MB/part)
        per-part progress → file progress
CompleteMultipartUpload(Key, UploadId, Parts[{PartNumber,ETag}]) + Idempotency-Key  → { Location, Key, ETag, Metadata }
   (cancel at any point) → AbortMultipartUpload(Key, UploadId)
```

> **Presigned S3 PUTs bypass the `Instance`** (no envelope, no auth headers) — they're the sanctioned non‑factory
> network calls. Everything else goes through factories. See [data-layer §5](./data-layer.md).

## 3. Two distinct drag‑and‑drop targets (dnd‑kit)

| Gesture | Meaning | Handler |
|---|---|---|
| Drag **OS file(s)** onto the storage area | **Upload** | file‑drop zone → enqueue uploads |
| Drag an **existing item** onto a folder | **Move** | dnd‑kit sortable/draggable → `Cloud/Move` |

These must never be ambiguous — separate sensors/affordances, distinct drop visuals.

## 4. Folder upload
Recurse the dropped/selected directory tree: create directories (`Cloud/Directory`) then upload files into them,
preserving structure. Conflicts route through the [conflict pattern](./conflict-resolution.md).

## 5. Pre‑flight limits (quota / max‑size)
Before starting, compute total size; if `TotalSize > MaxUploadSizeBytes` or `Used + TotalSize > StorageLimit`, **block
with a clear message + upgrade hint** — no silent failure. (The backend also enforces this on `CreateMultipartUpload`,
returning 400; the client should pre‑empt for UX.)

### 5.4 Touch / mobile alternative
`webkitdirectory` (folder upload via the OS file picker) is **desktop only** — mobile browsers do not implement it
reliably and the affordance is hidden on touch. On touch devices, item-level operations use a **long-press → bottom
sheet** with **`Add files` / `Move to` / `Delete`** entries (no drag-and-drop, no folder picker). The supported‑surface
matrix lives in [`SUPPORTED-BROWSERS.md` §5](../06-cross-cutting/SUPPORTED-BROWSERS.md#5-touch--mobile-alternative).

## 6. Locked operational concerns

The bullets that used to live under §6 Resilience (`Idempotency-Key`, `Abort`, part‑level retry, `X-Folder-Session`)
are absorbed and made specific below. The numbers in this section are decisions, not guidance.

### 6.1 Concurrency caps
- **4 chunks / file** in flight.
- **3 files** uploading concurrently.
- **60 MB** total in‑flight cap across the queue (the cap wins when chunk‑count limits would exceed it).
- All three values are read from **`lib/upload/config.ts`** and are the only place they may be changed. Features must
  not hard‑code their own limits.

### 6.2 Refresh resumability (IndexedDB)
`features/storage/upload/storage/queue.ts` persists each queue entry to IndexedDB:

```ts
type PersistedUploadEntry = {
  file: Blob;                 // the original Blob — IndexedDB stores it natively
  key: string;                // S3 object key
  uploadId: string;           // multipart UploadId from CreateMultipartUpload
  partETags: Record<number, string>;   // partNumber → ETag, written on every successful PUT
  idempotencyKey: string;     // reused on CompleteMultipartUpload retry
  status: 'queued' | 'uploadInProgress' | 'completing' | 'done' | 'error' | 'abortPending';
};
```

On refresh, `useUploadQueue()` reads IndexedDB and for each entry whose status is `uploadInProgress`:

1. Calls `ListParts(Key, UploadId)`.
2. Re‑presigns the parts that are missing from the returned list.
3. Resumes from the last‑good part — already‑completed parts are not re‑uploaded.

Entries older than **7 days** are evicted on load (TTL). If `ListParts` returns **404**, the backend session is gone:
mark the entry `error` with the user‑facing message **"Upload session expired"** and drop it from the queue.

### 6.3 Multipart abort + `AbortMultipartUpload` server cleanup
On user cancel:

1. The per‑file `AbortController` closes the in‑flight TCP connections immediately.
2. The client `POST`s `/Cloud/Upload/Abort/{uploadId}` (**idempotent** — safe to repeat).

If that abort call fails (network/5xx), the queue entry is marked **`abortPending`** and retried on the next app load
(**3 attempts**, then dropped). Orphaned multipart uploads that escape this — e.g. a tab killed before either the
client abort or the retry could land — are the responsibility of the backend's **daily orphan‑cleanup sweep**
(contract expectation, documented against the upload module).

### 6.4 ETag persistence + lost‑ETag recovery
Every presigned `PUT` response's `ETag` header is captured into `partETags[partNumber]` and **persisted to IndexedDB
immediately** — not batched, not deferred. If an `ETag` is lost (response not observed, write to IndexedDB failed,
intermediary stripped the header):

1. Call `ListParts(Key, UploadId)` to recover the canonical part list.
2. Restore the in‑memory + persisted `partETags` map from the response.
3. If a part is **missing** post‑recovery, re‑`PUT` the **same part number** — S3 part `PUT` is idempotent on
   `(UploadId, PartNumber)`, so this is safe.

### 6.5 Presigned `PUT` error mapping

| Status | Cause | UX action |
|---|---|---|
| 403 | URL expired or signature mismatch | Re‑presign the single part and retry once. A second 403 → **"Session expired"** toast + full re‑presign of all remaining parts. |
| 404 | Backend upload session is gone | **"Upload session expired"** toast + drop the entry. |
| 5xx | S3 transient | Exponential backoff **1 s / 2 s / 4 s × 3 attempts**, then fail the part. |
| Timeout | Network | Same as 5xx (1 s / 2 s / 4 s × 3). |
| 200, missing `ETag` | Intermediary stripped the header | Treat the PUT as a success **but** trigger §6.4 lost‑ETag recovery before `CompleteMultipartUpload`. |

### 6.6 Zero‑byte files + MIME inference
- **0‑byte file** → skip multipart entirely. No `CreateMultipartUpload`, no `GetMultipartPartUrls`, no `Complete`. A
  single presigned `PUT` writes the empty object.
- **`ContentType`** is resolved as `file.type || mimeFromExtension(file.name) || 'application/octet-stream'`. The
  extension table lives in **`lib/upload/mime.ts`**.
- The backend re‑checks MIME against the bytes and rejects mismatches with **`409 ApiError.code = MIME_MISMATCH`** —
  surface the typed error to the feature handler, do not toast it generically.

## 7. States (per file + tray)
queued → presigning → uploading (n%) → completing → done · error (retry) · paused (resume) · canceled (aborted).
Tray shows aggregate progress; folder view reflects completed items (invalidate list + usage on each `done`).

## 8. Edge cases
- Part URL expiry mid‑upload → re‑presign (see §6.5, 403 row).
- Network loss → pause + resumable (keep `UploadId` + completed parts; see §6.2).
- Quota crossed mid‑batch (other uploads finished) → block remaining + message.
- Conflict on completion → conflict dialog (apply‑to‑all for batches).
