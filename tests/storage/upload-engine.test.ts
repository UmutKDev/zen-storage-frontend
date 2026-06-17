import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { PART_SIZE_BYTES } from "@/lib/upload/config";
import type { PersistedUploadEntry } from "@/features/storage/upload/storage/queue";

const createUpload = vi.fn();
const uploadPart = vi.fn();
const completeUpload = vi.fn();
const abortUpload = vi.fn();
vi.mock("@/features/storage/upload/api", () => ({
  createUpload,
  uploadPart,
  completeUpload,
  abortUpload,
}));
vi.mock("@/features/storage/upload/lib/md5", () => ({
  partMd5Base64: vi.fn().mockResolvedValue("bWQ1"),
}));
const persistEntry = vi.fn(() => Promise.resolve());
const removeEntry = vi.fn(() => Promise.resolve());
const loadEntries = vi.fn(() =>
  Promise.resolve([] as PersistedUploadEntry[]),
);
vi.mock("@/features/storage/upload/storage/queue", () => ({
  persistEntry,
  removeEntry,
  loadEntries,
}));

const { uploadEngine } = await import(
  "@/features/storage/upload/core/engine"
);
const { useUploadsStore } = await import(
  "@/features/storage/upload/stores/uploads.store"
);

const items = () => useUploadsStore.getState().items;
const itemByName = (name: string) =>
  items().find((i) => i.fileName === name);

function makeFile(name: string, size: number): File {
  return new File([new ArrayBuffer(size)], name, { type: "text/plain" });
}

function conflictError() {
  return new ApiError({
    code: "CONFLICT",
    messages: [],
    raw: {
      Status: {
        Messages: [
          {
            Conflicts: [{ Source: { Name: "a.txt" }, Target: {} }],
            TotalItems: 1,
            ConflictCount: 1,
          },
        ],
      },
    },
  });
}

const serverError = () =>
  new ApiError({ code: "SERVER_ERROR", messages: ["boom"], httpStatus: 500 });

/** A promise the test resolves/rejects manually (in-flight simulation). */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** uploadPart mock that stays in flight until aborted via the signal. */
function hangUntilAborted() {
  uploadPart.mockImplementation(
    (_input, opts?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        opts?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadEngine.cancelAll();
  createUpload.mockImplementation((input: { key: string }) =>
    Promise.resolve({ UploadId: "up-1", Key: input.key }),
  );
  uploadPart.mockResolvedValue({ ETag: "etag" });
  completeUpload.mockResolvedValue({ Key: "k", ETag: "e" });
  abortUpload.mockResolvedValue(undefined);
});
afterEach(() => {
  uploadEngine.cancelAll();
  uploadEngine.setOnCompleted(null);
  vi.useRealTimers();
});

describe("upload engine — happy paths", () => {
  it("uploads a small file end to end and reports completion", async () => {
    const done: string[] = [];
    uploadEngine.setOnCompleted((path) => done.push(path));
    uploadEngine.enqueue([{ file: makeFile("a.txt", 10), path: "docs" }], "u1");

    await vi.waitFor(() => expect(itemByName("a.txt")?.status).toBe("done"));
    expect(createUpload).toHaveBeenCalledTimes(1);
    expect(createUpload.mock.calls[0]?.[0]).toMatchObject({
      key: "docs/a.txt",
      contentType: "text/plain",
      totalSize: 10,
    });
    expect(uploadPart).toHaveBeenCalledTimes(1);
    expect(uploadPart.mock.calls[0]?.[0]).toMatchObject({
      partNumber: 1,
      contentMd5: "bWQ1",
    });
    expect(completeUpload).toHaveBeenCalledTimes(1);
    expect(completeUpload.mock.calls[0]?.[0].parts).toEqual([
      { PartNumber: 1, ETag: "etag" },
    ]);
    expect(done).toEqual(["docs"]);
    // done entries leave IndexedDB
    expect(removeEntry).toHaveBeenCalled();
  });

  it("zero-byte file = one empty part, no special path", async () => {
    uploadEngine.enqueue([{ file: makeFile("empty.txt", 0), path: "" }], "u1");
    await vi.waitFor(() =>
      expect(itemByName("empty.txt")?.status).toBe("done"),
    );
    expect(createUpload.mock.calls[0]?.[0]).toMatchObject({ totalSize: 0 });
    expect(uploadPart).toHaveBeenCalledTimes(1);
    const sent = uploadPart.mock.calls[0]?.[0].part as Blob;
    expect(sent.size).toBe(0);
  });

  it("slices multi-part files on config boundaries", async () => {
    const size = 2 * PART_SIZE_BYTES + 5;
    uploadEngine.enqueue([{ file: makeFile("big.bin", size), path: "" }], "u1");
    await vi.waitFor(() => expect(itemByName("big.bin")?.status).toBe("done"));
    expect(uploadPart).toHaveBeenCalledTimes(3);
    const parts = uploadPart.mock.calls
      .map((c) => c[0] as { partNumber: number; part: Blob })
      .sort((a, b) => a.partNumber - b.partNumber);
    expect(parts.map((p) => p.part.size)).toEqual([
      PART_SIZE_BYTES,
      PART_SIZE_BYTES,
      5,
    ]);
    expect(completeUpload.mock.calls[0]?.[0].parts).toHaveLength(3);
  });

  it("uses the RESOLVED key from Create for parts + Complete (KEEP_BOTH rename)", async () => {
    createUpload.mockResolvedValue({ UploadId: "up-9", Key: "a (1).txt" });
    uploadEngine.enqueue([{ file: makeFile("a.txt", 4), path: "" }], "u1");
    await vi.waitFor(() => expect(itemByName("a.txt")?.status).toBe("done"));
    expect(uploadPart.mock.calls[0]?.[0]).toMatchObject({ key: "a (1).txt" });
    expect(completeUpload.mock.calls[0]?.[0]).toMatchObject({
      key: "a (1).txt",
    });
  });
});

describe("upload engine — retries + errors", () => {
  it("retries a transient part failure with backoff, then succeeds", async () => {
    vi.useFakeTimers();
    uploadPart
      .mockRejectedValueOnce(serverError())
      .mockResolvedValue({ ETag: "etag" });
    uploadEngine.enqueue([{ file: makeFile("r.txt", 4), path: "" }], "u1");

    await vi.waitFor(() => expect(itemByName("r.txt")?.status).toBe("done"), {
      timeout: 15_000,
    });
    expect(uploadPart).toHaveBeenCalledTimes(2);
  });

  it("fails the file after the retry budget and keeps it retryable", async () => {
    vi.useFakeTimers();
    uploadPart.mockRejectedValue(serverError());
    uploadEngine.enqueue([{ file: makeFile("f.txt", 4), path: "" }], "u1");

    await vi.waitFor(() => expect(itemByName("f.txt")?.status).toBe("error"), {
      timeout: 15_000,
    });
    expect(uploadPart).toHaveBeenCalledTimes(3); // 1 + 2 retries
    expect(itemByName("f.txt")?.errorMessage).toBe("boom");

    // user retry: parts restart; complete succeeds
    uploadPart.mockResolvedValue({ ETag: "etag" });
    const id = itemByName("f.txt")?.id ?? "";
    uploadEngine.retry(id);
    await vi.waitFor(() => expect(itemByName("f.txt")?.status).toBe("done"), {
      timeout: 15_000,
    });
  });

  it("non-transient part errors fail immediately (no retry)", async () => {
    uploadPart.mockRejectedValue(
      new ApiError({ code: "VALIDATION", messages: ["bad"], httpStatus: 400 }),
    );
    uploadEngine.enqueue([{ file: makeFile("v.txt", 4), path: "" }], "u1");
    await vi.waitFor(() => expect(itemByName("v.txt")?.status).toBe("error"));
    expect(uploadPart).toHaveBeenCalledTimes(1);
  });

  it("quota failure on Create blocks the batch's remaining queued files", async () => {
    const quota = new ApiError({
      code: "VALIDATION",
      messages: ["Storage limit exceeded. Please upgrade your subscription."],
      httpStatus: 400,
    });
    // 4 files: 3 start (concurrency cap), the 4th stays queued.
    let first = true;
    createUpload.mockImplementation(() => {
      if (first) {
        first = false;
        return Promise.reject(quota);
      }
      return new Promise(() => undefined); // others stay in flight
    });
    uploadEngine.enqueue(
      [1, 2, 3, 4].map((n) => ({ file: makeFile(`q${n}.txt`, 4), path: "" })),
      "u1",
    );
    await vi.waitFor(() => expect(itemByName("q1.txt")?.status).toBe("error"));
    await vi.waitFor(() =>
      expect(itemByName("q4.txt")?.status).toBe("blocked"),
    );
  });
});

describe("upload engine — conflicts (batch radius)", () => {
  it("409 on Create opens the conflict gate; REPLACE re-creates with the strategy", async () => {
    createUpload
      .mockRejectedValueOnce(conflictError())
      .mockResolvedValue({ UploadId: "up-2", Key: "a.txt" });
    uploadEngine.enqueue([{ file: makeFile("a.txt", 4), path: "" }], "u1");

    await vi.waitFor(() =>
      expect(itemByName("a.txt")?.status).toBe("conflict"),
    );
    const gate = uploadEngine.firstConflict();
    expect(gate).not.toBeNull();

    uploadEngine.resolveConflict(gate!.id, "REPLACE", false);
    await vi.waitFor(() => expect(itemByName("a.txt")?.status).toBe("done"));
    expect(createUpload).toHaveBeenCalledTimes(2);
    expect(createUpload.mock.calls[1]?.[0]).toMatchObject({
      strategy: "REPLACE",
    });
  });

  it("apply-to-all remembers the strategy for the whole batch", async () => {
    createUpload.mockImplementation((input: { key: string; strategy?: string }) =>
      input.strategy
        ? Promise.resolve({ UploadId: "up", Key: input.key })
        : Promise.reject(conflictError()),
    );
    uploadEngine.enqueue(
      [
        { file: makeFile("x.txt", 4), path: "" },
        { file: makeFile("y.txt", 4), path: "" },
      ],
      "u1",
    );

    await vi.waitFor(() => expect(uploadEngine.firstConflict()).not.toBeNull());
    const gate = uploadEngine.firstConflict()!;
    expect(gate.batchSize).toBe(2);

    uploadEngine.resolveConflict(gate.id, "KEEP_BOTH", true);
    await vi.waitFor(() => {
      expect(itemByName("x.txt")?.status).toBe("done");
      expect(itemByName("y.txt")?.status).toBe("done");
    });
    // No second prompt: the remembered strategy auto-resolved the sibling.
    expect(uploadEngine.firstConflict()).toBeNull();
  });

  it("SKIP cancels locally — never re-sent to the server (backend rejects it)", async () => {
    createUpload.mockRejectedValue(conflictError());
    uploadEngine.enqueue([{ file: makeFile("s.txt", 4), path: "" }], "u1");
    await vi.waitFor(() =>
      expect(itemByName("s.txt")?.status).toBe("conflict"),
    );

    uploadEngine.resolveConflict(uploadEngine.firstConflict()!.id, "SKIP", false);
    await vi.waitFor(() =>
      expect(itemByName("s.txt")?.status).toBe("canceled"),
    );
    expect(createUpload).toHaveBeenCalledTimes(1);
    expect(abortUpload).not.toHaveBeenCalled(); // no session was created
  });
});

describe("upload engine — pause / cancel / concurrency / resume", () => {
  it("cancel aborts in-flight parts and fires the server-side Abort", async () => {
    hangUntilAborted();
    uploadEngine.enqueue([{ file: makeFile("c.txt", 4), path: "" }], "u1");
    await vi.waitFor(() => expect(uploadPart).toHaveBeenCalled());

    const id = itemByName("c.txt")?.id ?? "";
    uploadEngine.cancel(id);
    await vi.waitFor(() =>
      expect(itemByName("c.txt")?.status).toBe("canceled"),
    );
    await vi.waitFor(() => expect(abortUpload).toHaveBeenCalledTimes(1));
    expect(abortUpload.mock.calls[0]?.[0]).toMatchObject({
      uploadId: "up-1",
    });
  });

  it("pause drains the in-flight part and resume finishes the file", async () => {
    const gate = deferred<{ ETag: string }>();
    uploadPart.mockReturnValueOnce(gate.promise);
    uploadEngine.enqueue([{ file: makeFile("p.txt", 4), path: "" }], "u1");
    await vi.waitFor(() => expect(uploadPart).toHaveBeenCalledTimes(1));

    const id = itemByName("p.txt")?.id ?? "";
    uploadEngine.pause(id);
    expect(itemByName("p.txt")?.status).toBe("paused");
    gate.resolve({ ETag: "etag-1" });
    // Drained: the settled part persists, but Complete must NOT run.
    await vi.waitFor(() => expect(persistEntry).toHaveBeenCalled());
    expect(completeUpload).not.toHaveBeenCalled();

    uploadEngine.resume(id);
    await vi.waitFor(() => expect(itemByName("p.txt")?.status).toBe("done"));
    expect(completeUpload).toHaveBeenCalledTimes(1);
    // The drained part was not re-uploaded.
    expect(uploadPart).toHaveBeenCalledTimes(1);
  });

  it("starts at most MAX_CONCURRENT_FILES files", async () => {
    createUpload.mockImplementation(() => new Promise(() => undefined));
    uploadEngine.enqueue(
      [1, 2, 3, 4, 5].map((n) => ({
        file: makeFile(`m${n}.txt`, 4),
        path: "",
      })),
      "u1",
    );
    await vi.waitFor(() => expect(createUpload).toHaveBeenCalledTimes(3));
    await new Promise((r) => setTimeout(r, 20));
    expect(createUpload).toHaveBeenCalledTimes(3);
  });

  it("restores a persisted session and only uploads the missing parts", async () => {
    const size = PART_SIZE_BYTES + 7;
    loadEntries.mockResolvedValueOnce([
      {
        id: "persisted-1",
        ownerId: "u1",
        file: makeFile("resume.bin", size),
        fileName: "resume.bin",
        contentType: "application/octet-stream",
        totalSize: size,
        path: "docs",
        key: "docs/resume.bin",
        uploadId: "up-resume",
        partSize: PART_SIZE_BYTES,
        partETags: { 1: "etag-old" },
        idempotencyKey: "ik-persisted",
        status: "uploadInProgress",
        createdAt: Date.now(),
      },
    ]);

    await uploadEngine.restore("u1");
    await vi.waitFor(() =>
      expect(itemByName("resume.bin")?.status).toBe("done"),
    );
    expect(createUpload).not.toHaveBeenCalled(); // session already exists
    expect(uploadPart).toHaveBeenCalledTimes(1);
    expect(uploadPart.mock.calls[0]?.[0]).toMatchObject({
      partNumber: 2,
      uploadId: "up-resume",
    });
    expect(completeUpload.mock.calls[0]?.[0]).toMatchObject({
      idempotencyKey: "ik-persisted",
      parts: [
        { PartNumber: 1, ETag: "etag-old" },
        { PartNumber: 2, ETag: "etag" },
      ],
    });
  });
});
