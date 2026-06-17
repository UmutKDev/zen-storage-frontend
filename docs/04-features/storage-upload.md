# Feature — Storage: Upload (Phase 3) 🟢

> The upload UX. Architecture/flow: [upload-pipeline](../02-architecture/upload-pipeline.md) · API:
> [cloud-upload](../05-api/modules/cloud-upload.md).

## Entry points
- **Buttons** on the storage page: Upload file(s), Upload folder.
- **Drag OS file(s)** onto the storage area (file‑drop zone) — distinct from dragging an item onto a folder (= move).

## UploadTray (global, persistent) — [pattern](../03-design-system/components/patterns.md)
**Layout:** floating sheet/popover, bottom‑right; collapsible; survives navigation.
```
Uploads (3)                              [minimize][clear done]
 ▸ report.pdf      ▓▓▓▓▓░░░ 62%   [pause][cancel]
 ▸ video.mp4       queued          [cancel]
 ▸ photo.jpg       ✓ done
```
**Per‑file states:** queued · presigning · uploading(n%) · completing · done · error(retry) · paused(resume) ·
canceled(aborted).

## Flow (per file)
`CreateMultipartUpload` (pre‑flight size/quota) → `GetMultipartPartUrls` (batch presign) → PUT parts to S3 → 
`CompleteMultipartUpload` (`Idempotency-Key`) / `Abort` on cancel. Folder upload recurses (create dirs + uploads).

## States / edge cases
- **Quota / max‑size pre‑flight:** block before starting with a clear message + upgrade hint (also enforced server‑side
  with 400). → state matrix "quota exceeded".
- **Conflict** on create/complete → `ConflictDialog` (apply‑to‑all for batches),
  [conflict-resolution](../02-architecture/conflict-resolution.md).
- Part URL expiry → re‑presign; network loss → pause + resumable; cancel → abort (no dangling multipart).
- **Encrypted‑folder uploads** carry `X-Folder-Session` automatically (Instance), Phase 5.
- Concurrency limit across files/parts.

## Feedback
- Progress in the tray + per‑item; on `done`, invalidate the folder list + usage.
- Toasts only for terminal errors/successes that need attention (progress stays in the tray, not toasts).

## a11y
- Tray is keyboard‑operable; progress has `aria-valuenow`; status changes announced via `aria-live` politely.
- Drop zones have visible focus/affordance; provide the button path for keyboard‑only users.
