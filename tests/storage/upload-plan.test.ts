import { describe, expect, it } from "vitest";
import { PART_SIZE_BYTES } from "@/lib/upload/config";
import { inferContentType, mimeFromExtension } from "@/lib/upload/mime";
import {
  destinationFileKey,
  partCount,
  partRange,
  preflight,
} from "@/features/storage/upload/lib/plan";
import {
  directoriesToCreate,
  filesFromDirectoryInput,
} from "@/features/storage/upload/lib/traverse";

const usage = {
  UsedStorageInBytes: 800,
  MaxStorageInBytes: 1000,
  MaxUploadSizeBytes: 150,
};

describe("partCount / partRange", () => {
  it("zero-byte files upload as ONE empty part (no special path)", () => {
    expect(partCount(0, PART_SIZE_BYTES)).toBe(1);
    expect(partRange(0, 1, PART_SIZE_BYTES)).toEqual({ start: 0, end: 0 });
  });

  it("splits on exact part-size boundaries", () => {
    expect(partCount(PART_SIZE_BYTES, PART_SIZE_BYTES)).toBe(1);
    expect(partCount(PART_SIZE_BYTES + 1, PART_SIZE_BYTES)).toBe(2);
    expect(partCount(3 * PART_SIZE_BYTES, PART_SIZE_BYTES)).toBe(3);
  });

  it("clamps the last part to the file size", () => {
    const size = PART_SIZE_BYTES + 5;
    expect(partRange(size, 1, PART_SIZE_BYTES)).toEqual({
      start: 0,
      end: PART_SIZE_BYTES,
    });
    expect(partRange(size, 2, PART_SIZE_BYTES)).toEqual({
      start: PART_SIZE_BYTES,
      end: size,
    });
  });

  it("honors the PERSISTED part size, not the live config (resume invariant)", () => {
    expect(partCount(10, 4)).toBe(3);
    expect(partRange(10, 3, 4)).toEqual({ start: 8, end: 10 });
  });
});

describe("destinationFileKey", () => {
  it("joins folder + name; root has no leading slash", () => {
    expect(destinationFileKey("", "a.txt")).toBe("a.txt");
    expect(destinationFileKey("docs/2026", "a.txt")).toBe("docs/2026/a.txt");
  });
});

describe("preflight", () => {
  it("passes when within limits", () => {
    expect(preflight([{ name: "a", size: 100 }], usage)).toEqual({ ok: true });
  });

  it("blocks a single file over MaxUploadSizeBytes", () => {
    expect(preflight([{ name: "big.bin", size: 151 }], usage)).toEqual({
      ok: false,
      reason: "maxSize",
      fileName: "big.bin",
    });
  });

  it("blocks when the batch total crosses the storage limit", () => {
    expect(
      preflight(
        [
          { name: "a", size: 120 },
          { name: "b", size: 120 },
        ],
        usage,
      ),
    ).toEqual({ ok: false, reason: "quota" });
  });

  it("counts bytes already committed to the queue", () => {
    expect(preflight([{ name: "a", size: 120 }], usage, 100)).toEqual({
      ok: false,
      reason: "quota",
    });
  });
});

describe("mime inference", () => {
  it("prefers the file's own type", () => {
    expect(inferContentType({ name: "a.txt", type: "text/x-custom" })).toBe(
      "text/x-custom",
    );
  });

  it("falls back to the extension table, then octet-stream", () => {
    expect(inferContentType({ name: "a.PDF", type: "" })).toBe(
      "application/pdf",
    );
    expect(inferContentType({ name: "weird.zzz", type: "" })).toBe(
      "application/octet-stream",
    );
    expect(mimeFromExtension("noext")).toBeUndefined();
  });
});

describe("directoriesToCreate", () => {
  it("returns unique chains, shallowest first", () => {
    const out = directoriesToCreate([
      { file: {} as File, relativeDir: "a/b" },
      { file: {} as File, relativeDir: "a" },
      { file: {} as File, relativeDir: "" },
      { file: {} as File, relativeDir: "a/b" },
    ]);
    expect(out).toEqual(["a", "a/b"]);
  });
});

describe("filesFromDirectoryInput", () => {
  it("derives the relative dir from webkitRelativePath", () => {
    const file = new File(["x"], "a.txt");
    Object.defineProperty(file, "webkitRelativePath", {
      value: "root/sub/a.txt",
    });
    expect(filesFromDirectoryInput([file])).toEqual([
      { file, relativeDir: "root/sub" },
    ]);
  });
});
