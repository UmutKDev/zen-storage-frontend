/**
 * Microsoft Office Online embed viewer. The viewer fetches `src` from Microsoft's
 * servers (server-side), so `src` MUST be a publicly-reachable URL — we pass a
 * fresh presigned URL, never an app-authenticated one. Note: this egresses the
 * document to a third party (see DECISIONS D-P4.3 + the privacy doc).
 */
const OFFICE_EMBED_BASE = "https://view.officeapps.live.com/op/embed.aspx";

/** Build the Office Online embed URL for a publicly-fetchable document URL. */
export function officeEmbedUrl(publicUrl: string): string {
  return `${OFFICE_EMBED_BASE}?src=${encodeURIComponent(publicUrl)}`;
}
