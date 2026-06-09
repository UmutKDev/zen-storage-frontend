import { describe, expect, it } from "vitest";
import type { FolderEntry } from "@/features/storage/browse/lib/entries";
import {
  blockedPrefixes,
  canDropOn,
  resolveDragSet,
} from "@/features/storage/operations/lib/dnd";

const dirEntry = (name: string, prefix = `${name}/`): FolderEntry => ({
  kind: "dir",
  key: prefix,
  name,
  dir: {
    Name: name,
    Prefix: prefix,
    IsEncrypted: false,
    IsLocked: false,
    IsHidden: false,
    IsConcealed: false,
  } as never,
});
const fileEntry = (name: string, key = `k/${name}`): FolderEntry => ({
  kind: "file",
  key,
  name,
  file: { Name: name, Path: { Key: key, Host: "", Url: "" } } as never,
});

const photos = dirEntry("Photos");
const archive = dirEntry("Archive");
const a = fileEntry("a.txt");
const b = fileEntry("b.txt");
const all = [archive, photos, a, b];

describe("resolveDragSet", () => {
  it("drags the whole selection when the active entry is part of it", () => {
    expect(resolveDragSet(a.key, [archive, a], all)).toEqual([archive, a]);
  });

  it("drags just the active entry when it is outside the selection", () => {
    expect(resolveDragSet(b.key, [archive, a], all)).toEqual([b]);
  });

  it("returns empty for an unknown key", () => {
    expect(resolveDragSet("nope", [], all)).toEqual([]);
  });
});

describe("blockedPrefixes", () => {
  it("collects dragged dir prefixes only", () => {
    expect(blockedPrefixes([archive, a, photos])).toEqual(
      new Set(["Archive/", "Photos/"]),
    );
  });
});

describe("canDropOn", () => {
  it("rejects an empty set", () => {
    expect(canDropOn([], "Photos", "")).toBe(false);
  });

  it("rejects the current folder (no-op)", () => {
    expect(canDropOn([a], "", "")).toBe(false);
    expect(canDropOn([a], "docs", "docs")).toBe(false);
  });

  it("rejects dropping a dir onto itself", () => {
    expect(canDropOn([photos], "Photos", "")).toBe(false);
  });

  it("rejects dropping a dir into its own subtree", () => {
    expect(canDropOn([photos], "Photos/2026", "")).toBe(false);
  });

  it("allows a sibling folder", () => {
    expect(canDropOn([a, photos], "Archive", "")).toBe(true);
  });

  it("allows an ancestor (breadcrumb) target", () => {
    const nested = dirEntry("2026", "Photos/2026/");
    expect(canDropOn([nested], "", "Photos")).toBe(true);
  });
});
