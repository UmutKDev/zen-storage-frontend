import { fileExtension } from "@/lib/utils";

/** Vector/icon formats the CDN resizer would rasterize — always served original. */
const UNSCALED_EXT = new Set(["svg", "ico"]);

/**
 * Append CDN resize params (`?w=&h=`) to a signed CDN URL. The CDN fronts
 * rustfs via a wsrv.nl reverse proxy, so the URL is **opaque + already signed**
 * — we only append query params (string-level, preserving the existing URL
 * byte-for-byte so any signature stays intact), never rebuild it. Returns the
 * URL unchanged when no dimensions are given or the format is unscalable.
 */
export function getImageCdnUrl(
  url: string,
  opts: { name: string; width?: number; height?: number },
): string {
  const w = opts.width && opts.width > 0 ? Math.round(opts.width) : undefined;
  const h =
    opts.height && opts.height > 0 ? Math.round(opts.height) : undefined;
  if (!w && !h) return url;
  if (UNSCALED_EXT.has(fileExtension(opts.name))) return url;

  const params: string[] = [];
  if (w) params.push(`w=${w}`);
  if (h) params.push(`h=${h}`);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${params.join("&")}`;
}

/** Parse the string `Width`/`Height` on `CloudMetadataDefaultModel` (absent for
 *  non-images). Returns undefined when missing or unparseable. */
export function parseDimension(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
