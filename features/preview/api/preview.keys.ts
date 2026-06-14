import { scopedKey } from "@/lib/api";

/**
 * Preview query keys, **user-scoped** by `ownerId` (team-readiness — a workspace
 * switch swaps the whole cache namespace). Keyed by the file `Key`.
 */
export const previewKeys = {
  object: (ownerId: string, key: string) =>
    scopedKey(ownerId, "preview", "object", key),
  scan: (ownerId: string, key: string) =>
    scopedKey(ownerId, "preview", "scan", key),
  /** Presigned URL used as the Microsoft Office embed `src`. */
  officeSrc: (ownerId: string, key: string) =>
    scopedKey(ownerId, "preview", "office-src", key),
  /** Object version list (lazy — fetched when the history panel expands). */
  versions: (ownerId: string, key: string) =>
    scopedKey(ownerId, "preview", "versions", key),
  /** Document editor content (+draft) for the CodeMirror editor. */
  document: (ownerId: string, key: string) =>
    scopedKey(ownerId, "preview", "document", key),
  /** Document version list (lazy — fetched when the doc history panel expands). */
  documentVersions: (ownerId: string, key: string) =>
    scopedKey(ownerId, "preview", "document-versions", key),
  /** Backend-computed diff of a document version vs the current content. */
  documentDiff: (ownerId: string, key: string, source: string) =>
    scopedKey(ownerId, "preview", "document-diff", key, source),
} as const;
