import { describe, expect, it } from "vitest";
import { isAncestor } from "@/lib/utils";

describe("isAncestor", () => {
  it("treats equal paths as ancestors of themselves", () => {
    expect(isAncestor("a/b", "a/b")).toBe(true);
  });

  it("matches true ancestors", () => {
    expect(isAncestor("a", "a/b/c")).toBe(true);
    expect(isAncestor("a/b", "a/b/c")).toBe(true);
  });

  it("treats the root as ancestor of everything", () => {
    expect(isAncestor("", "a/b")).toBe(true);
    expect(isAncestor("", "")).toBe(true);
  });

  it("is segment-based — no string-prefix bug", () => {
    expect(isAncestor("a/b", "a/bc")).toBe(false);
    expect(isAncestor("a/b", "a/bc/d")).toBe(false);
  });

  it("a deeper path is not an ancestor of a shallower one", () => {
    expect(isAncestor("a/b/c", "a/b")).toBe(false);
  });

  it("siblings are not ancestors", () => {
    expect(isAncestor("a/x", "a/y/z")).toBe(false);
  });

  it("normalizes stray slashes via segmentation", () => {
    expect(isAncestor("a/", "a/b")).toBe(true);
  });
});
