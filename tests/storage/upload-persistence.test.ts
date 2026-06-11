import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { PERSISTED_ENTRY_TTL_MS } from "@/lib/upload/config";
import {
  loadEntries,
  persistEntry,
  removeEntry,
  type PersistedUploadEntry,
} from "@/features/storage/upload/storage/queue";

const NOW = 1_750_000_000_000;

function entry(
  id: string,
  overrides: Partial<PersistedUploadEntry> = {},
): PersistedUploadEntry {
  return {
    id,
    ownerId: "u1",
    file: new Blob(["x"]),
    fileName: `${id}.txt`,
    contentType: "text/plain",
    totalSize: 1,
    path: "",
    key: `${id}.txt`,
    uploadId: `up-${id}`,
    partSize: 8,
    partETags: { 1: "e1" },
    idempotencyKey: `ik-${id}`,
    status: "uploadInProgress",
    createdAt: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  // Fresh IndexedDB per test.
  globalThis.indexedDB = new IDBFactory();
});

describe("upload queue persistence", () => {
  it("round-trips an entry incl. the blob and partETags", async () => {
    await persistEntry(entry("a"));
    const loaded = await loadEntries("u1", NOW);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: "a",
      uploadId: "up-a",
      partETags: { 1: "e1" },
      idempotencyKey: "ik-a",
    });
    // NOTE: fake-indexeddb's structured clone degrades Blob contents; real
    // browsers store the Blob natively. We only assert the field survives.
    expect(loaded[0]?.file).toBeDefined();
  });

  it("filters by owner (team-ready scope)", async () => {
    await persistEntry(entry("mine"));
    await persistEntry(entry("theirs", { ownerId: "u2" }));
    const loaded = await loadEntries("u1", NOW);
    expect(loaded.map((e) => e.id)).toEqual(["mine"]);
  });

  it("evicts entries older than the 7-day TTL on load", async () => {
    await persistEntry(
      entry("old", { createdAt: NOW - PERSISTED_ENTRY_TTL_MS - 1 }),
    );
    await persistEntry(entry("fresh"));
    expect((await loadEntries("u1", NOW)).map((e) => e.id)).toEqual(["fresh"]);
    // the eviction is durable
    expect((await loadEntries("u1", NOW)).map((e) => e.id)).toEqual(["fresh"]);
  });

  it("drops finished entries and removes deleted ones", async () => {
    await persistEntry(entry("done", { status: "done" }));
    await persistEntry(entry("gone"));
    await removeEntry("gone");
    expect(await loadEntries("u1", NOW)).toHaveLength(0);
  });
});
