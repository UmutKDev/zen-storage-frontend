import { beforeEach, describe, expect, it, vi } from "vitest";

const directoryUnlock = vi.fn(() =>
  Promise.resolve({ data: { SessionToken: "T", EncryptedFolderPath: "work" } }),
);
const directoryLock = vi.fn(() => Promise.resolve({ data: true }));
const directoryConvertToEncrypted = vi.fn(() => Promise.resolve({ data: {} }));
const directoryDecrypt = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock("@/service/factories", () => ({
  cloudDirectoryApiFactory: {
    directoryUnlock,
    directoryLock,
    directoryConvertToEncrypted,
    directoryDecrypt,
  },
}));

const { unlockFolder, lockFolder, encryptFolder, decryptFolder } = await import(
  "@/features/secure-folders/api"
);

const SUPPRESS = { suppressErrorToast: true };

beforeEach(() => vi.clearAllMocks());

describe("secure-folder mutation wrappers", () => {
  it("unlockFolder sends the passphrase header + path, returns the bare model", async () => {
    const out = await unlockFolder("work", "hunter2!");
    expect(directoryUnlock).toHaveBeenCalledWith(
      {
        xFolderPassphrase: "hunter2!",
        directoryUnlockRequestModel: { Path: "work" },
      },
      SUPPRESS,
    );
    expect(out).toEqual({ SessionToken: "T", EncryptedFolderPath: "work" });
  });

  it("lockFolder sends just the path (no passphrase)", async () => {
    await lockFolder("work");
    expect(directoryLock).toHaveBeenCalledWith({
      directoryLockRequestModel: { Path: "work" },
    });
  });

  it("encryptFolder sends the passphrase header + path", async () => {
    await encryptFolder("docs", "hunter2!");
    expect(directoryConvertToEncrypted).toHaveBeenCalledWith(
      {
        xFolderPassphrase: "hunter2!",
        directoryConvertToEncryptedRequestModel: { Path: "docs" },
      },
      SUPPRESS,
    );
  });

  it("decryptFolder sends the passphrase header + path", async () => {
    await decryptFolder("docs", "hunter2!");
    expect(directoryDecrypt).toHaveBeenCalledWith(
      {
        xFolderPassphrase: "hunter2!",
        directoryDecryptRequestModel: { Path: "docs" },
      },
      SUPPRESS,
    );
  });
});
