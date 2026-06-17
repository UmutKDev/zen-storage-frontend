import { describe, expect, it } from "vitest";
import { isEnabled } from "@/lib/flags";

describe("Phase 2 deferral flags", () => {
  it("avatar upload is off by default (endpoint inactive — Q7)", () => {
    expect(isEnabled("avatarUpload")).toBe(false);
  });

  it("api-keys management is off by default (post-MVP)", () => {
    expect(isEnabled("apiKeys")).toBe(false);
  });
});
