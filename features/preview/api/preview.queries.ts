import { cloudApiFactory, cloudDocumentsApiFactory } from "@/service/factories";
import type {
  CloudObjectModel,
  CloudVersionListResponseModel,
  DocumentContentResponseModel,
  DocumentDiffResponseModel,
} from "@/service/models";

/**
 * Resolve a single file's metadata via `Cloud/Find` — `Name/Extension/MimeType`,
 * the signed CDN `Path.Url` (drives the inline viewers), and image `Metadata`.
 * The envelope interceptor already unwrapped `{ Result, Status }`, so `res.data`
 * IS the `CloudObjectModel` (don't read `.Result`). `xTeamId`/folder-session
 * headers are injected by the interceptors.
 */
export async function findObject(
  key: string,
  signal?: AbortSignal,
): Promise<CloudObjectModel> {
  const res = await cloudApiFactory.find({ key }, { signal });
  return res.data as unknown as CloudObjectModel;
}

/**
 * Fetch a file's bytes through the Instance (`Cloud/Download`, `responseType:
 * blob`) for same-origin inline preview (the PDF blob). Goes through the factory
 * — NOT a raw `fetch` of the CDN — so it obeys the no-raw-HTTP rule; the envelope
 * interceptor passes binary bodies through untouched, and `suppressErrorToast`
 * lets the viewer own its fallback UI.
 */
export async function downloadBlob(
  key: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await cloudApiFactory.download(
    { key },
    { responseType: "blob", signal, suppressErrorToast: true },
  );
  return res.data as unknown as Blob;
}

/**
 * A presigned, publicly-fetchable URL for the file — used as the Microsoft Office
 * embed `src` (Microsoft fetches it server-side, so it must not require the app
 * session). Same endpoint as Share; fetched as a query when an office file opens.
 */
export async function getPresignedSrc(
  key: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await cloudApiFactory.getPresignedUrl({ key }, { signal });
  return res.data as unknown as string;
}

/** List an object's S3 versions (`Cloud/Versions`). `res.data` is the bare model. */
export async function listVersions(
  key: string,
  signal?: AbortSignal,
): Promise<CloudVersionListResponseModel> {
  const res = await cloudApiFactory.listVersions({ key }, { signal });
  return res.data as unknown as CloudVersionListResponseModel;
}

/**
 * Read a document's editable text (`Cloud/Documents/Content`). With
 * `includeDraft`, returns the saved draft over the committed content (`IsDraft`
 * flags which). Also carries `ContentHash` (the optimistic-concurrency base) +
 * `LockStatus`/`LockedBy`. `res.data` is the bare model.
 */
export async function readDocument(
  key: string,
  includeDraft: boolean,
  signal?: AbortSignal,
): Promise<DocumentContentResponseModel> {
  const res = await cloudDocumentsApiFactory.readContent(
    { key, includeDraft },
    { signal },
  );
  return res.data as unknown as DocumentContentResponseModel;
}

/**
 * List a document's versions (`Cloud/Documents/Versions`). Reuses the object
 * `CloudVersionListResponseModel` (`{ Versions: CloudVersionModel[] }`); the
 * backend lists only the non-current versions, newest first. `res.data` is the
 * bare model (post-envelope).
 */
export async function listDocumentVersions(
  key: string,
  signal?: AbortSignal,
): Promise<CloudVersionListResponseModel> {
  const res = await cloudDocumentsApiFactory.listVersions({ key }, { signal });
  return res.data as unknown as CloudVersionListResponseModel;
}

/**
 * Backend-computed diff of one document version vs the current content
 * (`Cloud/Documents/Versions/Diff`). `"current"` is the live-version sentinel.
 * The server returns unified-diff `Hunks` (`Lines` are raw `+/-/ `-prefixed
 * strings) + `Stats` — no client-side diffing. `suppressErrorToast` so the
 * panel renders its own inline error. `res.data` is the bare model.
 */
export async function diffDocumentVersions(
  key: string,
  sourceVersionId: string,
  signal?: AbortSignal,
): Promise<DocumentDiffResponseModel> {
  const res = await cloudDocumentsApiFactory.diffVersions(
    { key, sourceVersionId, targetVersionId: "current" },
    { signal, suppressErrorToast: true },
  );
  return res.data as unknown as DocumentDiffResponseModel;
}
