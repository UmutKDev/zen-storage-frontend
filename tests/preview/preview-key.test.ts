import { describe, expect, it } from "vitest";
import {
  decodePreviewKey,
  encodePreviewKey,
  previewHref,
} from "@/lib/preview";

describe("preview key", () => {
  it("round-trips keys with slashes and special characters", () => {
    const keys = [
      "a.jpg",
      "Projects/2026/report.pdf",
      "weird name (1)/é.png",
      "a/b c/d&e.txt",
    ];
    for (const key of keys) {
      expect(decodePreviewKey(encodePreviewKey(key))).toBe(key);
    }
  });

  it("encodes the whole key into one slash-free segment", () => {
    const seg = encodePreviewKey("a/b/c.pdf");
    expect(seg).toBe("a%2Fb%2Fc.pdf");
    expect(seg).not.toContain("/");
  });

  it("builds the storage preview route", () => {
    expect(previewHref("a/b.pdf")).toBe("/storage/preview/a%2Fb.pdf");
  });
});
