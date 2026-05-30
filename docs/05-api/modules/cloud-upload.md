# API — Cloud Upload (multipart)

> `@Controller('Cloud/Upload')` → `/Api/Cloud/Upload/*`. File: `src/modules/cloud/cloud.upload.controller.ts`.
> CASL `CloudUpload`/`Upload` · throttled. Back to [API index](../API-INVENTORY.md). Pipeline:
> [upload-pipeline](../../02-architecture/upload-pipeline.md).

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/CreateMultipartUpload` | `CloudCreateMultipartUploadRequestModel` (Key, ContentType?, Metadata?, TotalSize, ConflictStrategy?) | `…ResponseModel` (UploadId, Key) | **Pre‑checks:** `TotalSize > MaxUploadSizeBytes` → 400; `Used + TotalSize > StorageLimit` → 400 |
| POST | `/GetMultipartPartUrl` | `…PartUrlRequestModel` (Key, UploadId, PartNumber) | `{ Url, Expires }` | presigned (single) |
| POST | `/GetMultipartPartUrls` | `…BatchRequestModel` (Key, UploadId, TotalParts?/PartNumbers?) | `{ Parts:[{PartNumber,Url,Expires}] }` | **batch presign** (preferred) |
| POST | `/UploadPart` | multipart (Key, UploadId, PartNumber, File, ContentMd5?) | `{ ETag }` | proxy path; max **10 MB/part** |
| POST | `/CompleteMultipartUpload` | `…CompleteRequestModel` (Key, UploadId, Parts:[{PartNumber,ETag}]) | `{ Location, Key, Bucket, ETag, Metadata }` | **`idempotency-key`** |
| DELETE | `/AbortMultipartUpload` | `…AbortRequestModel` (Key, UploadId) | void | cancel/cleanup |

- Optional **`x-folder-session`** for uploads into encrypted folders.
- **Presigned S3 PUTs are not backend calls** — they bypass the [Instance](../../02-architecture/data-layer.md)
  (no envelope, no auth headers). Everything else goes through factories.

## Client flow
```
CreateMultipartUpload (pre-flight) → GetMultipartPartUrls (batch) → PUT parts to S3
  → CompleteMultipartUpload (Idempotency-Key)   |   cancel → AbortMultipartUpload
```
Pre‑empt quota/max‑size client‑side for UX; the backend still enforces with 400. Conflicts route through the
[conflict pattern](../../02-architecture/conflict-resolution.md). Re‑presign expired part URLs; never leave dangling
uploads (always `Abort` on cancel).
