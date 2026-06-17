import { describe, expect, it } from "vitest";
import { getImageCdnUrl, parseDimension } from "@/lib/preview";

const URL_BASE = "https://cdn.storage.umutk.me/k/p.jpg";

describe("getImageCdnUrl", () => {
  it("appends w/h resize params", () => {
    expect(getImageCdnUrl(URL_BASE, { name: "p.jpg", width: 800 })).toBe(
      `${URL_BASE}?w=800`,
    );
    expect(
      getImageCdnUrl(URL_BASE, { name: "p.jpg", width: 800, height: 600 }),
    ).toBe(`${URL_BASE}?w=800&h=600`);
  });

  it("uses & when the URL already has a query (preserves any signature)", () => {
    const signed = `${URL_BASE}?sig=abc`;
    expect(getImageCdnUrl(signed, { name: "p.jpg", width: 400 })).toBe(
      `${signed}&w=400`,
    );
  });

  it("returns the URL unchanged with no usable dimensions", () => {
    expect(getImageCdnUrl(URL_BASE, { name: "p.jpg" })).toBe(URL_BASE);
    expect(
      getImageCdnUrl(URL_BASE, { name: "p.jpg", width: 0, height: -5 }),
    ).toBe(URL_BASE);
  });

  it("never scales SVG/ICO (the resizer would rasterize them)", () => {
    const svg = "https://cdn.storage.umutk.me/x.svg";
    expect(getImageCdnUrl(svg, { name: "x.svg", width: 800 })).toBe(svg);
  });

  it("rounds fractional dimensions", () => {
    expect(getImageCdnUrl(URL_BASE, { name: "p.jpg", width: 799.6 })).toBe(
      `${URL_BASE}?w=800`,
    );
  });
});

describe("parseDimension", () => {
  it("parses positive numeric strings", () => {
    expect(parseDimension("800")).toBe(800);
  });

  it("returns undefined for missing or invalid values", () => {
    expect(parseDimension(undefined)).toBeUndefined();
    expect(parseDimension("")).toBeUndefined();
    expect(parseDimension("abc")).toBeUndefined();
    expect(parseDimension("0")).toBeUndefined();
  });
});
