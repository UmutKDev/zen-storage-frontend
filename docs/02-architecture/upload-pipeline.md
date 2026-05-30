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

## 6. Resilience
- **Idempotency‑Key** on `CompleteMultipartUpload` → safe manual retry.
- **Abort** on cancel → server‑side cleanup; never leave dangling multipart uploads.
- **Retry** a failed part without restarting the whole file (re‑presign expired part URLs).
- **Encrypted‑folder uploads** carry `X-Folder-Session` (via the Instance) — see
  [secure-folder-lifecycle](./secure-folder-lifecycle.md).

## 7. States (per file + tray)
queued → presigning → uploading (n%) → completing → done · error (retry) · paused (resume) · canceled (aborted).
Tray shows aggregate progress; folder view reflects completed items (invalidate list + usage on each `done`).

## 8. Edge cases
- Part URL expiry mid‑upload → re‑presign.
- Network loss → pause + resumable (keep `UploadId` + completed parts).
- Quota crossed mid‑batch (other uploads finished) → block remaining + message.
- Conflict on completion → conflict dialog (apply‑to‑all for batches).
