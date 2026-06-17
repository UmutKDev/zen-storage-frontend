import { formatDate } from "./format-date";

/**
 * Compact relative time ("2 min. ago", "1 hr. ago", "yesterday", "3 days ago")
 * via the native `Intl.RelativeTimeFormat` — zero-dependency and locale-aware
 * (it follows the runtime locale, so it localizes for free when i18n grows past
 * EN). Past ~7 days it falls back to an absolute date (a relative "12 days ago"
 * reads worse than "Jun 3"). Returns `""` for an unparseable value, mirroring
 * `formatDate`.
 */
const RELATIVE = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "short",
});

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;
const WEEK = 7 * DAY;

export function formatRelativeTime(
  value: string | number | Date,
  now: Date = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  if (Number.isNaN(ms)) return "";

  // Negative = in the past (the common case for timestamps).
  const deltaSeconds = Math.round((ms - now.getTime()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);

  if (absSeconds < 45) return RELATIVE.format(0, "second"); // "now"
  if (absSeconds < HOUR) return RELATIVE.format(Math.round(deltaSeconds / MINUTE), "minute");
  if (absSeconds < DAY) return RELATIVE.format(Math.round(deltaSeconds / HOUR), "hour");
  if (absSeconds < WEEK) return RELATIVE.format(Math.round(deltaSeconds / DAY), "day");
  return formatDate(date);
}
