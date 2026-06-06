/**
 * Single source of idempotency keys. Move / Delete / CompleteMultipartUpload
 * mint ONE key per logical op and reuse it across every retry path so the
 * backend's 24h replay window recognizes the replay (see data-layer §2.8).
 *
 * UUID v7 (time-ordered) is used so keys sort by creation and index well
 * server-side. Implemented on the Web Crypto API — no runtime dependency.
 */
export function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const timestamp = Date.now();
  // 48-bit big-endian unix-ms timestamp in the first 6 bytes.
  bytes[0] = (timestamp / 2 ** 40) & 0xff;
  bytes[1] = (timestamp / 2 ** 32) & 0xff;
  bytes[2] = (timestamp / 2 ** 24) & 0xff;
  bytes[3] = (timestamp / 2 ** 16) & 0xff;
  bytes[4] = (timestamp / 2 ** 8) & 0xff;
  bytes[5] = timestamp & 0xff;

  // Version (7) and variant (RFC 4122) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
