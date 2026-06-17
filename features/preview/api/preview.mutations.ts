import { cloudApiFactory, cloudDocumentsApiFactory } from "@/service/factories";
import type {
  DocumentContentResponseModel,
  DocumentLockResponseModel,
  DocumentDraftResponseModel,
} from "@/service/models";

/**
 * Mint a time-limited presigned URL for sharing (and as the download source).
 * `Cloud/PresignedUrl` returns a bare `string` (post-envelope `res.data`). The
 * URL self-authorizes (signed) and expires — the share UX communicates the TTL.
 */
export async function getShareUrl(key: string): Promise<string> {
  const res = await cloudApiFactory.getPresignedUrl({ key });
  return res.data as unknown as string;
}

/** Restore a prior object version (`Cloud/Versions/Restore`). */
export async function restoreVersion(input: {
  Key: string;
  VersionId: string;
}): Promise<void> {
  await cloudApiFactory.restoreVersion({
    cloudRestoreVersionRequestModel: { Key: input.Key, VersionId: input.VersionId },
  });
}

/** Delete a non-current object version (`DELETE /Cloud/Versions`). */
export async function deleteVersion(input: {
  Key: string;
  VersionId: string;
}): Promise<void> {
  await cloudApiFactory.deleteVersion({
    cloudDeleteVersionRequestModel: { Key: input.Key, VersionId: input.VersionId },
  });
}

/* ── Document editor (lock / heartbeat / draft / commit) ──────────────────── */

// Lock + draft failures are caller-handled (423 = locked-by-other, 429 = draft
// throttle), so they suppress the central toast; the typed ApiError still throws.
const SUPPRESS = { suppressErrorToast: true } as const;

/** Acquire (or extend, if already mine) the 5-min edit lock; `423` if held by
 *  another user. */
export async function acquireLock(key: string): Promise<DocumentLockResponseModel> {
  const res = await cloudDocumentsApiFactory.acquireLock(
    { documentKeyRequestModel: { Key: key } },
    SUPPRESS,
  );
  return res.data as unknown as DocumentLockResponseModel;
}

/** Heartbeat — extend the edit lock (~every 3 min). `423` if lost to another. */
export async function extendLock(key: string): Promise<DocumentLockResponseModel> {
  const res = await cloudDocumentsApiFactory.extendLock(
    { documentKeyRequestModel: { Key: key } },
    SUPPRESS,
  );
  return res.data as unknown as DocumentLockResponseModel;
}

/** Release the edit lock (best-effort, on editor close/unmount). */
export async function releaseLock(key: string): Promise<void> {
  await cloudDocumentsApiFactory.releaseLock(
    { documentKeyRequestModel: { Key: key } },
    SUPPRESS,
  );
}

/** Auto-save a draft (throttled ≤1/10s; `429` + `NextAllowedSaveAt` pace it). */
export async function saveDraft(
  key: string,
  content: string,
): Promise<DocumentDraftResponseModel> {
  const res = await cloudDocumentsApiFactory.saveDraft(
    { documentDraftRequestModel: { Key: key, Content: content } },
    SUPPRESS,
  );
  return res.data as unknown as DocumentDraftResponseModel;
}

/** Discard the server-side draft (after a successful commit, or on user discard). */
export async function discardDraft(key: string): Promise<void> {
  await cloudDocumentsApiFactory.discardDraft(
    { documentKeyRequestModel: { Key: key } },
    SUPPRESS,
  );
}

/** Commit content. `ExpectedContentHash` enforces optimistic concurrency —
 *  `409` if it changed elsewhere (passes through; the editor shows a reload
 *  banner). Generic failures toast centrally. */
export async function updateDocument(input: {
  Key: string;
  Content: string;
  ExpectedContentHash?: string;
}): Promise<DocumentContentResponseModel> {
  const res = await cloudDocumentsApiFactory.updateContent({
    documentUpdateContentRequestModel: {
      Key: input.Key,
      Content: input.Content,
      ExpectedContentHash: input.ExpectedContentHash,
    },
  });
  return res.data as unknown as DocumentContentResponseModel;
}

/* ── Document versions (restore / delete) ─────────────────────────────────── */

/** Restore a prior document version as the new current content
 *  (`PUT /Cloud/Documents/Versions/Restore`). The open editor reloads after. */
export async function restoreDocumentVersion(input: {
  Key: string;
  VersionId: string;
}): Promise<void> {
  await cloudDocumentsApiFactory.restoreVersion({
    documentRestoreVersionRequestModel: {
      Key: input.Key,
      VersionId: input.VersionId,
    },
  });
}

/** Delete a non-current document version (`DELETE /Cloud/Documents/Versions`). */
export async function deleteDocumentVersion(input: {
  Key: string;
  VersionId: string;
}): Promise<void> {
  await cloudDocumentsApiFactory.deleteVersion({
    documentDeleteVersionRequestModel: {
      Key: input.Key,
      VersionId: input.VersionId,
    },
  });
}
