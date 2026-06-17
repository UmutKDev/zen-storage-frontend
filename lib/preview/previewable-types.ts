import { extensionCategory, fileExtension } from "@/lib/utils";

/**
 * Which inline viewer renders a file in the preview modal. `unsupported` means
 * "no inline view — offer download". Stage A handles image/video/audio/pdf;
 * Stage B promotes office; Stage C promotes text/code.
 *
 * Extension-based (reliable, reuses the single `extensionCategory` classifier);
 * MimeType is intentionally not consulted at MVP.
 */
export type ViewerKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "office"
  | "editor"
  | "unsupported";

/**
 * Office formats the Microsoft Office Online viewer (`view.officeapps.live.com`)
 * renders. `csv` is intentionally excluded (it's edited as text); `pdf` has its
 * own viewer.
 */
export const OFFICE_EMBED_EXT = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
]);

/**
 * Text/code formats opened in the CodeMirror document editor (Stage C). Syntax
 * highlighting is resolved separately by `editorLanguageForName`; anything here
 * without a language mapping edits as plain text.
 */
export const EDITOR_EXT = new Set([
  "txt", "md", "markdown", "json", "js", "jsx", "mjs", "cjs", "ts", "tsx",
  "css", "scss", "less", "html", "htm", "xml", "yml", "yaml", "toml", "ini",
  "env", "sh", "bash", "py", "sql", "log", "csv",
]);

/** Resolve the viewer kind from a file name. */
export function viewerKindForName(name: string): ViewerKind {
  const ext = fileExtension(name);
  if (ext === "pdf") return "pdf";
  if (OFFICE_EMBED_EXT.has(ext)) return "office";
  if (EDITOR_EXT.has(ext)) return "editor";
  switch (extensionCategory(ext)) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    default:
      return "unsupported";
  }
}

/** True when a file has an inline viewer (drives the arrow-nav previewable list). */
export function isPreviewableName(name: string): boolean {
  return viewerKindForName(name) !== "unsupported";
}
