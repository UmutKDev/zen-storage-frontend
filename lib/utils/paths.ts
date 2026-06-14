/**
 * Pure helpers for the storage path model (the `[[...path]]` catch-all). A path
 * is the slash-joined list of folder segments, no leading/trailing slash.
 */

/** Split a path string into clean, non-empty segments. */
export function toSegments(path: string | undefined | null): string[] {
  if (!path) return [];
  return path.split("/").filter(Boolean);
}

/** Join segments into a normalized path string. */
export function fromSegments(segments: readonly string[]): string {
  return segments.filter(Boolean).join("/");
}

/** Parent path of a given path (empty string at the root). */
export function parentPath(path: string): string {
  const segments = toSegments(path);
  segments.pop();
  return fromSegments(segments);
}

/** The last segment (folder/file name) of a path. */
export function basename(path: string): string {
  const segments = toSegments(path);
  return segments[segments.length - 1] ?? "";
}

/**
 * Is `ancestor` an ancestor of — or equal to — `path`? Segment-based, so
 * `a/b` is an ancestor of `a/b/c` but NOT of `a/bc` (no string-prefix bug). The
 * root (`""`) is an ancestor of every path. Drives the secure-folder
 * ancestor-aware token lookup (unlock a parent → its children open too).
 */
export function isAncestor(ancestor: string, path: string): boolean {
  const a = toSegments(ancestor);
  const p = toSegments(path);
  if (a.length > p.length) return false;
  return a.every((segment, i) => segment === p[i]);
}
