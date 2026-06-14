import { fileExtension } from "@/lib/utils";

/**
 * CodeMirror language keys the editor supports. Pure (no `@codemirror/*` import)
 * so `lib/preview` stays dependency-free — the editor chunk resolves the key to
 * an actual language `Extension`. Anything unmapped edits as `plain` text.
 */
export type EditorLanguageKey =
  | "javascript"
  | "json"
  | "markdown"
  | "html"
  | "css"
  | "python"
  | "yaml"
  | "plain";

const EXT_LANGUAGE: Record<string, EditorLanguageKey> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "javascript",
  tsx: "javascript",
  json: "json",
  md: "markdown",
  markdown: "markdown",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  less: "css",
  py: "python",
  yml: "yaml",
  yaml: "yaml",
};

/** Map a file name to its editor language key (`plain` when unmapped). */
export function editorLanguageForName(name: string): EditorLanguageKey {
  return EXT_LANGUAGE[fileExtension(name)] ?? "plain";
}
