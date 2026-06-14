import { describe, expect, it } from "vitest";
import { fromRouteSegments } from "@/lib/utils";

describe("fromRouteSegments — decodes the [[...path]] catch-all", () => {
  it("decodes a percent-encoded segment so the path is raw (fixes %2520 double-encode)", () => {
    // Next hands segments back encoded; a space must come through as a space so
    // the API serializer encodes it ONCE, not twice.
    expect(fromRouteSegments(["Profiller", "Betul%20Cakmak"])).toBe(
      "Profiller/Betul Cakmak",
    );
  });

  it("passes an already-clean segment through unchanged", () => {
    expect(fromRouteSegments(["a", "b"])).toBe("a/b");
  });

  it("handles undefined and empty segments → root path", () => {
    expect(fromRouteSegments(undefined)).toBe("");
    expect(fromRouteSegments([])).toBe("");
    expect(fromRouteSegments(["", "x", ""])).toBe("x");
  });

  it("keeps a malformed segment verbatim instead of throwing", () => {
    expect(fromRouteSegments(["a", "%zz"])).toBe("a/%zz");
  });

  it("decodes an encoded percent literal in a folder name", () => {
    // "50%off" → encoded "50%25off" → must decode back to "50%off".
    expect(fromRouteSegments(["50%25off"])).toBe("50%off");
  });
});
