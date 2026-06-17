import { describe, expect, it } from "vitest";
import { formatDate, formatRelativeTime } from "@/lib/utils";

// Assert against `Intl`'s own output so the test is locale-independent (the
// helper and the test share the same formatter config).
const RTF = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "short",
});
const NOW = new Date("2026-06-15T12:00:00.000Z");
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe("formatRelativeTime", () => {
  it("returns '' for an unparseable value", () => {
    expect(formatRelativeTime("not-a-date", NOW)).toBe("");
  });

  it("says 'now' within the last 45 seconds", () => {
    expect(formatRelativeTime(ago(10), NOW)).toBe(RTF.format(0, "second"));
  });

  it("formats minutes ago", () => {
    expect(formatRelativeTime(ago(5 * 60), NOW)).toBe(RTF.format(-5, "minute"));
  });

  it("formats hours ago", () => {
    expect(formatRelativeTime(ago(3 * 3600), NOW)).toBe(RTF.format(-3, "hour"));
  });

  it("formats days ago (and 'yesterday' via numeric:auto)", () => {
    expect(formatRelativeTime(ago(2 * 86_400), NOW)).toBe(RTF.format(-2, "day"));
    expect(formatRelativeTime(ago(26 * 3600), NOW)).toBe(RTF.format(-1, "day"));
  });

  it("falls back to an absolute date past ~7 days", () => {
    const old = ago(30 * 86_400);
    expect(formatRelativeTime(old, NOW)).toBe(formatDate(old));
    expect(formatRelativeTime(old, NOW)).not.toMatch(/ago/i);
  });
});
