import { describe, expect, it } from "vitest";
import { itemsOf } from "@/lib/api";

describe("itemsOf — list shape normalization", () => {
  it("returns a bare array unchanged", () => {
    expect(itemsOf([{ Id: "a" }, { Id: "b" }])).toEqual([
      { Id: "a" },
      { Id: "b" },
    ]);
  });

  it("extracts .items from a paginated { items, count } envelope", () => {
    expect(itemsOf({ items: [{ Id: "a" }], count: 1 })).toEqual([{ Id: "a" }]);
  });

  it("falls back to [] for null / unexpected shapes", () => {
    expect(itemsOf(null)).toEqual([]);
    expect(itemsOf(undefined)).toEqual([]);
    expect(itemsOf({})).toEqual([]);
    expect(itemsOf("nope")).toEqual([]);
  });
});
