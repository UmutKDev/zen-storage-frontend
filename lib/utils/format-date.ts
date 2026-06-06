/**
 * Locale-aware date formatting helpers. Thin wrappers over `Intl` so call sites
 * never hand-roll date strings.
 */
export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatDateTime(value: string | number | Date): string {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}
