import { beforeEach, describe, expect, it, vi } from "vitest";

const directoryReveal = vi.fn(() =>
  Promise.resolve({ data: { SessionToken: "T", HiddenFolderPath: "work/secret" } }),
);
const directoryHide = vi.fn(() => Promise.resolve({ data: {} }));
const directoryUnhide = vi.fn(() => Promise.resolve({ data: {} }));
const directoryConceal = vi.fn(() => Promise.resolve({ data: true }));

vi.mock("@/service/factories", () => ({
  cloudDirectoryApiFactory: {
    directoryReveal,
    directoryHide,
    directoryUnhide,
    directoryConceal,
  },
}));

const { revealFolder, hideFolder, unhideFolder, concealFolder } = await import(
  "@/features/secure-folders/api"
);

const SUPPRESS = { suppressErrorToast: true };

beforeEach(() => vi.clearAllMocks());

describe("hidden-folder mutation wrappers", () => {
  it("revealFolder sends the passphrase header + path, returns the bare model", async () => {
    const out = await revealFolder("work", "hunter2!");
    expect(directoryReveal).toHaveBeenCalledWith(
      {
        xFolderPassphrase: "hunter2!",
        directoryRevealRequestModel: { Path: "work" },
      },
      SUPPRESS,
    );
    expect(out).toEqual({ SessionToken: "T", HiddenFolderPath: "work/secret" });
  });

  it("revealFolder sends '/' for the root folder (app uses '')", async () => {
    await revealFolder("", "hunter2!");
    expect(directoryReveal).toHaveBeenCalledWith(
      {
        xFolderPassphrase: "hunter2!",
        directoryRevealRequestModel: { Path: "/" },
      },
      SUPPRESS,
    );
  });

  it("hideFolder sends the passphrase header + path", async () => {
    await hideFolder("docs", "hunter2!");
    expect(directoryHide).toHaveBeenCalledWith(
      { xFolderPassphrase: "hunter2!", directoryHideRequestModel: { Path: "docs" } },
      SUPPRESS,
    );
  });

  it("unhideFolder sends the passphrase header + path", async () => {
    await unhideFolder("docs", "hunter2!");
    expect(directoryUnhide).toHaveBeenCalledWith(
      { xFolderPassphrase: "hunter2!", directoryUnhideRequestModel: { Path: "docs" } },
      SUPPRESS,
    );
  });

  it("concealFolder sends just the path (no passphrase)", async () => {
    await concealFolder("work/secret");
    expect(directoryConceal).toHaveBeenCalledWith(
      { directoryConcealRequestModel: { Path: "work/secret" } },
      SUPPRESS,
    );
  });
});
