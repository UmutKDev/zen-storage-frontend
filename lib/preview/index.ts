// Neutral preview helpers (pure, no feature deps). Both `features/storage`
// (row/menu wiring, nav-list filter) and `features/preview` (the modal) import
// these — keeping the two features acyclic (storage → lib/preview only).
export { encodePreviewKey, decodePreviewKey, previewHref } from "./key";
export {
  viewerKindForName,
  isPreviewableName,
  OFFICE_EMBED_EXT,
  EDITOR_EXT,
  type ViewerKind,
} from "./previewable-types";
export { getImageCdnUrl, parseDimension } from "./image-cdn";
export { officeEmbedUrl } from "./office-embed";
export {
  editorLanguageForName,
  type EditorLanguageKey,
} from "./editor-language";
