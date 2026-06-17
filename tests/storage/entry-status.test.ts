import { describe, expect, it } from "vitest";
import { entryStatus } from "@/features/storage/browse/components/EntryStatusChip";
import type { FolderEntry } from "@/features/storage/browse/lib/entries";

const encDir = (locked: boolean): FolderEntry => ({
  kind: "dir",
  key: "secret/",
  name: "secret",
  dir: {
    Name: "secret",
    Prefix: "secret/",
    IsEncrypted: true,
    IsLocked: locked,
    IsHidden: false,
    IsConcealed: false,
  } as never,
});

describe("entryStatus — encrypted folders read their lock state", () => {
  it("locked → closed-lock chip + 'Encrypted'", () => {
    const s = entryStatus(encDir(true));
    expect(s?.chip).toBe("lock");
    expect(s?.word).toBe("Encrypted");
  });

  it("unlocked (session held → IsLocked:false) → open-lock chip + 'Unlocked'", () => {
    const s = entryStatus(encDir(false));
    expect(s?.chip).toBe("unlock");
    expect(s?.word).toBe("Unlocked");
  });

  it("a plain folder has no status chip", () => {
    expect(
      entryStatus({
        kind: "dir",
        key: "plain/",
        name: "plain",
        dir: {
          Name: "plain",
          Prefix: "plain/",
          IsEncrypted: false,
          IsLocked: false,
          IsHidden: false,
          IsConcealed: false,
        } as never,
      }),
    ).toBeNull();
  });
});
