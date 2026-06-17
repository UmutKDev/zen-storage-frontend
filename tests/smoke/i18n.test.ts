import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";

describe("i18n legal namespace", () => {
  it("resolves legal keys to real strings (not the key)", () => {
    expect(t("legal.privacy.heading")).toBe("Privacy Policy");
    expect(t("legal.banner.acceptAll")).toBe("Accept all");
  });

  it("returns the key for a missing path", () => {
    expect(t("legal.nope.missing")).toBe("legal.nope.missing");
  });
});
