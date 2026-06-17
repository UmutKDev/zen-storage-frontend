import { describe, expect, it } from "vitest";
import {
  arrangeEntries,
  filterEntries,
  toEntries,
} from "@/features/storage/browse/lib/entries";

const dir = (name: string) =>
  ({
    Name: name,
    Prefix: `${name}/`,
    IsEncrypted: false,
    IsLocked: false,
    IsHidden: false,
    IsConcealed: false,
  }) as never;

const file = (name: string, size = 1, modified = "2026-01-01") =>
  ({
    Name: name,
    Extension: name.split(".").pop() ?? "",
    MimeType: "application/octet-stream",
    Path: { Host: "", Key: `k/${name}`, Url: "" },
    Size: size,
    LastModified: modified,
    ETag: "e",
  }) as never;

const sample = () =>
  toEntries(
    [dir("docs"), dir("pics")],
    [
      file("photo.jpg"),
      file("clip.mp4"),
      file("song.mp3"),
      file("report.pdf"),
      file("notes.txt"),
      file("bundle.zip"),
      file("data.bin"),
    ],
  );

describe("filterEntries", () => {
  it("passes everything for the 'all' filter", () => {
    expect(filterEntries(sample(), { type: "all", ext: "" })).toHaveLength(9);
  });

  it("keeps only folders for the 'folder' filter", () => {
    const out = filterEntries(sample(), { type: "folder", ext: "" });
    expect(out.every((e) => e.kind === "dir")).toBe(true);
    expect(out).toHaveLength(2);
  });

  it("maps extensions to coarse categories", () => {
    const byType = (type: Parameters<typeof filterEntries>[1]["type"]) =>
      filterEntries(sample(), { type, ext: "" }).map((e) => e.name);
    expect(byType("image")).toEqual(["photo.jpg"]);
    expect(byType("video")).toEqual(["clip.mp4"]);
    expect(byType("audio")).toEqual(["song.mp3"]);
    expect(byType("doc")).toEqual(["report.pdf"]);
    expect(byType("text")).toEqual(["notes.txt"]);
    expect(byType("archive")).toEqual(["bundle.zip"]);
  });

  it("excludes uncategorized extensions from specific filters but keeps them in 'all'", () => {
    expect(
      filterEntries(sample(), { type: "doc", ext: "" }).map((e) => e.name),
    ).not.toContain("data.bin");
    expect(
      filterEntries(sample(), { type: "all", ext: "" }).map((e) => e.name),
    ).toContain("data.bin");
  });

  it("narrows by extension (folders drop out once an extension is set)", () => {
    const out = filterEntries(sample(), { type: "all", ext: "jpg" });
    expect(out.map((e) => e.name)).toEqual(["photo.jpg"]);
  });

  it("composes type + extension", () => {
    expect(
      filterEntries(sample(), { type: "image", ext: "mp4" }),
    ).toHaveLength(0);
    expect(
      filterEntries(sample(), { type: "image", ext: "jpg" }).map((e) => e.name),
    ).toEqual(["photo.jpg"]);
  });
});

describe("arrangeEntries", () => {
  it("filters then sorts, folders first", () => {
    const out = arrangeEntries(sample(), {
      sortKey: "name",
      sortDir: "asc",
      filterType: "all",
      filterExt: "",
    });
    expect(out[0].kind).toBe("dir");
    expect(out.slice(0, 2).map((e) => e.name)).toEqual(["docs", "pics"]);
  });

  it("drops folders when a file-only filter is active", () => {
    const out = arrangeEntries(sample(), {
      sortKey: "name",
      sortDir: "asc",
      filterType: "image",
      filterExt: "",
    });
    expect(out.every((e) => e.kind === "file")).toBe(true);
    expect(out.map((e) => e.name)).toEqual(["photo.jpg"]);
  });
});
