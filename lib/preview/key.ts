/**
 * The preview route param is a single dynamic segment, but a file Key contains
 * slashes (`Projects/2026/report.pdf`). We percent-encode the whole Key into one
 * opaque segment (slashes → `%2F`) — the single chokepoint for encode/decode so
 * a different scheme (e.g. base64url) is a one-line swap if needed. Mirrors the
 * per-segment `encodeURIComponent` in `features/storage/browse/lib/href.ts`.
 */

/** Encode a file Key into the `[key]` route segment. */
export function encodePreviewKey(key: string): string {
  return encodeURIComponent(key);
}

/** Decode the `[key]` route segment back into the file Key. */
export function decodePreviewKey(segment: string): string {
  return decodeURIComponent(segment);
}

/** Deep-link URL for a file's preview modal (intercepted on soft nav). */
export function previewHref(key: string): string {
  return `/storage/preview/${encodePreviewKey(key)}`;
}
