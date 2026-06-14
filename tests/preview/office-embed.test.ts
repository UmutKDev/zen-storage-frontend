import { describe, expect, it } from "vitest";
import { officeEmbedUrl } from "@/lib/preview";

describe("officeEmbedUrl", () => {
  it("wraps a public URL in the Microsoft Office Online embed viewer URL", () => {
    const url = "https://cdn.storage.umutk.me/s?token=a&x=1";
    expect(officeEmbedUrl(url)).toBe(
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
    );
  });

  it("percent-encodes the src so query chars don't leak into the embed URL", () => {
    const out = officeEmbedUrl("https://x/y?a=1&b=2");
    expect(out.startsWith("https://view.officeapps.live.com/op/embed.aspx?src=")).toBe(
      true,
    );
    // The inner query separators are encoded, not left as live params.
    expect(out).not.toContain("&b=2");
    expect(out).toContain("%3F"); // the inner "?" is encoded
  });
});
