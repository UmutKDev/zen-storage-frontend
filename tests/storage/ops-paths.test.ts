import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  childFolderPath,
  destinationKey,
  dirRenamePath,
  entryItem,
} from "@/features/storage/operations/lib/paths";
import { extractConflictDetails } from "@/features/storage/operations/lib/conflict";
import type { FolderEntry } from "@/features/storage/browse/lib/entries";

describe("operations path helpers", () => {
  it("childFolderPath adds the parent prefix + trailing slash", () => {
    expect(childFolderPath("", "Reports")).toBe("Reports/");
    expect(childFolderPath("a/b", "c")).toBe("a/b/c/");
  });

  it("destinationKey: root is '/', nested gets a trailing slash", () => {
    expect(destinationKey("")).toBe("/");
    expect(destinationKey("a/b")).toBe("a/b/");
  });

  it("dirRenamePath strips the trailing slash", () => {
    expect(dirRenamePath("a/b/")).toBe("a/b");
  });

  it("entryItem: file → object key (not dir); dir → prefix (dir)", () => {
    const file: FolderEntry = {
      kind: "file",
      key: "k/x.txt",
      name: "x.txt",
      file: { Path: { Key: "k/x.txt" } } as never,
    };
    const dir: FolderEntry = {
      kind: "dir",
      key: "k/sub/",
      name: "sub",
      dir: { Prefix: "k/sub/" } as never,
    };
    expect(entryItem(file)).toEqual({ Key: "k/x.txt", IsDirectory: false });
    expect(entryItem(dir)).toEqual({ Key: "k/sub/", IsDirectory: true });
  });
});

describe("extractConflictDetails", () => {
  it("returns null for non-conflict errors", () => {
    expect(
      extractConflictDetails(new ApiError({ code: "SERVER_ERROR", messages: [] })),
    ).toBeNull();
    expect(extractConflictDetails(new Error("x"))).toBeNull();
  });

  it("parses ConflictDetails from a 409 error.raw.Status.Messages[0]", () => {
    const err = new ApiError({
      code: "CONFLICT",
      messages: [],
      raw: {
        Status: {
          Messages: [
            {
              Conflicts: [{ Source: { Name: "dup.txt" }, Target: {} }],
              TotalItems: 1,
              ConflictCount: 1,
            },
          ],
        },
      },
    });
    const details = extractConflictDetails(err);
    expect(details?.Conflicts?.[0]?.Source?.Name).toBe("dup.txt");
  });

  it("returns an empty shell for a conflict with no parseable details", () => {
    const err = new ApiError({ code: "CONFLICT", messages: [], raw: {} });
    expect(extractConflictDetails(err)).toEqual({
      Conflicts: [],
      TotalItems: 0,
      ConflictCount: 0,
    });
  });
});
