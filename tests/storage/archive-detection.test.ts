import { describe, expect, it } from "vitest";
import {
  archiveExtractFolderName,
  isExtractableArchive,
} from "@/features/storage/archive/lib/archive";

describe("isExtractableArchive", () => {
  it("accepts the formats the backend can extract", () => {
    for (const name of [
      "a.zip",
      "a.tar",
      "a.tar.gz",
      "a.tgz",
      "a.rar",
      "Photos.ZIP", // case-insensitive
      "nested.name.tar.gz",
    ]) {
      expect(isExtractableArchive(name)).toBe(true);
    }
  });

  it("rejects non-extractable archives and plain files", () => {
    for (const name of ["a.7z", "a.gz", "a.txt", "noext", "a.zipx", "archive"]) {
      expect(isExtractableArchive(name)).toBe(false);
    }
  });
});

describe("archiveExtractFolderName", () => {
  it("strips the archive extension (longest suffix wins)", () => {
    expect(archiveExtractFolderName("photos.zip")).toBe("photos");
    expect(archiveExtractFolderName("backup.tar.gz")).toBe("backup");
    expect(archiveExtractFolderName("backup.tgz")).toBe("backup");
    expect(archiveExtractFolderName("my.data.tar")).toBe("my.data");
  });

  it("falls back to the full name when there is no archive extension", () => {
    expect(archiveExtractFolderName("plain.txt")).toBe("plain.txt");
  });
});
