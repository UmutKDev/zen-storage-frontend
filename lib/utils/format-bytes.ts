const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/**
 * Human-readable byte size (binary, base-1024). `formatBytes(1536)` → "1.5 KB".
 * Used by the usage bar and file metadata.
 */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const digits = exponent === 0 ? 0 : fractionDigits;

  return `${value.toFixed(digits)} ${UNITS[exponent]}`;
}
