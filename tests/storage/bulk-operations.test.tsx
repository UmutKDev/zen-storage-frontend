import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import { ApiError } from "@/lib/api";
import { getCommands } from "@/lib/command-palette";
import { useViewPrefs } from "@/features/storage/browse/stores/viewPrefs.store";
import { useSelectionStore } from "@/features/storage/operations/stores/selection.store";

const createFolder = vi.fn();
const createFile = vi.fn();
const renameFile = vi.fn();
const renameDirectory = vi.fn();
const deleteEntries = vi.fn();
const moveEntries = vi.fn();
const getDownloadUrl = vi.fn();
const getDirectories = vi.fn();
const getObjects = vi.fn();
const getStorageUsage = vi.fn();

vi.mock("@/features/storage/operations/api", () => ({
  createFolder,
  createFile,
  renameFile,
  renameDirectory,
  deleteEntries,
  moveEntries,
  getDownloadUrl,
}));
vi.mock("@/features/storage/browse/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/storage/browse/api")>();
  return { ...actual, getDirectories, getObjects, getStorageUsage };
});

const { StorageBrowser } = await import(
  "@/features/storage/browse/components/StorageBrowser"
);

const usage = {
  UsedStorageInBytes: 500,
  MaxStorageInBytes: 1000,
  IsLimitExceeded: false,
  UsagePercentage: 50,
  MaxUploadSizeBytes: 100,
};
const dir = (name: string) => ({
  Name: name,
  Prefix: `${name}/`,
  IsEncrypted: false,
  IsLocked: false,
  IsHidden: false,
  IsConcealed: false,
});
const file = (name: string) => ({
  Name: name,
  Extension: "txt",
  MimeType: "text/plain",
  Path: { Host: "", Key: `k/${name}`, Url: "" },
  Size: 10,
  LastModified: "2026-01-01",
  ETag: "e",
});

function conflictError(conflictCount: number, totalItems: number) {
  return new ApiError({
    code: "CONFLICT",
    messages: [],
    raw: {
      Status: {
        Messages: [
          {
            Conflicts: [{ Source: { Name: "a.txt" }, Target: {} }],
            TotalItems: totalItems,
            ConflictCount: conflictCount,
          },
        ],
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  useViewPrefs.setState({ view: "list", sortKey: "name", sortDir: "asc" });
  useSelectionStore.getState().clear();
  getStorageUsage.mockResolvedValue(usage);
  getDirectories.mockResolvedValue([dir("Photos"), dir("Archive")]);
  getObjects.mockResolvedValue([file("a.txt"), file("b.txt")]);
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
});

const checkbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` });

async function selectFiles(user: ReturnType<typeof userEvent.setup>) {
  await user.click(checkbox("a.txt"));
  await user.click(checkbox("b.txt"));
}

describe("bulk delete", () => {
  it("deletes the selection in ONE call, dirs and files mixed", async () => {
    deleteEntries.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("Photos"));
    await user.click(checkbox("a.txt"));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete 2 items?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteEntries).toHaveBeenCalledTimes(1));
    expect(deleteEntries.mock.calls[0]?.[0]).toEqual([
      { Key: "Photos/", IsDirectory: true },
      { Key: "k/a.txt", IsDirectory: false },
    ]);
  });

  it("marks the targeted rows busy in place while the delete is in flight", async () => {
    let release: () => void = () => undefined;
    deleteEntries.mockImplementation(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await selectFiles(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    // In flight: the targeted rows stay on screen but dimmed/busy (loading
    // feedback), and untargeted rows are untouched.
    await waitFor(() =>
      expect(
        screen.getByText("a.txt").closest('[aria-busy="true"]'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText("b.txt").closest('[aria-busy="true"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Photos").closest('[aria-busy="true"]'),
    ).toBeNull();
    release();
  });
});

describe("bulk move", () => {
  async function openMoveAndPickPhotos(
    user: ReturnType<typeof userEvent.setup>,
  ) {
    await user.click(screen.getByRole("button", { name: "Move" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /Photos/ }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Move here" }));
    return dialog;
  }

  it("moves the selection in ONE call with the picked destination", async () => {
    moveEntries.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await selectFiles(user);
    await openMoveAndPickPhotos(user);

    await waitFor(() => expect(moveEntries).toHaveBeenCalledTimes(1));
    expect(moveEntries.mock.calls[0]?.[0]).toMatchObject({
      items: [
        { Key: "k/a.txt", IsDirectory: false },
        { Key: "k/b.txt", IsDirectory: false },
      ],
      destinationKey: "Photos/",
    });
  });

  it("shows batch-conflict copy and retries the SAME batch with REPLACE", async () => {
    moveEntries
      .mockRejectedValueOnce(conflictError(1, 2))
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await selectFiles(user);
    await openMoveAndPickPhotos(user);

    expect(
      await screen.findByText("1 of 2 items already exist here."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Replace/ }));

    await waitFor(() => expect(moveEntries).toHaveBeenCalledTimes(2));
    expect(moveEntries.mock.calls[1]?.[0]).toMatchObject({
      strategy: "REPLACE",
    });
    expect(moveEntries.mock.calls[1]?.[0].items).toEqual(
      moveEntries.mock.calls[0]?.[0].items,
    );
  });

  it("partial-batch SKIP retries server-side so the rest still moves", async () => {
    moveEntries
      .mockRejectedValueOnce(conflictError(1, 2))
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await selectFiles(user);
    await openMoveAndPickPhotos(user);

    await screen.findByText("1 of 2 items already exist here.");
    await user.click(screen.getByRole("button", { name: /^Skip/ }));

    await waitFor(() => expect(moveEntries).toHaveBeenCalledTimes(2));
    expect(moveEntries.mock.calls[1]?.[0]).toMatchObject({ strategy: "SKIP" });
  });

  it("full-batch SKIP cancels locally without a second call", async () => {
    moveEntries.mockRejectedValueOnce(conflictError(2, 2));
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await selectFiles(user);
    await openMoveAndPickPhotos(user);

    await screen.findByText("2 of 2 items already exist here.");
    await user.click(screen.getByRole("button", { name: /^Skip/ }));

    await waitFor(() =>
      expect(
        screen.queryByText("2 of 2 items already exist here."),
      ).not.toBeInTheDocument(),
    );
    expect(moveEntries).toHaveBeenCalledTimes(1);
  });
});

describe("bulk download", () => {
  it("loops presigns over the selected FILES only", async () => {
    getDownloadUrl.mockResolvedValue("https://signed.example/x");
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("Photos"));
    await selectFiles(user);
    await user.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => expect(getDownloadUrl).toHaveBeenCalledTimes(2), {
      timeout: 3000,
    });
    expect(getDownloadUrl).toHaveBeenCalledWith("k/a.txt");
    expect(getDownloadUrl).toHaveBeenCalledWith("k/b.txt");
    clickSpy.mockRestore();
  });

  it("disables Download when the selection holds no files", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("Photos"));
    const download = screen.getByRole("button", { name: /Download/ });
    expect(download).toHaveAttribute("aria-disabled", "true");
    expect(download).toHaveAccessibleDescription(
      "No files in the selection to download",
    );
    await user.click(download);
    expect(getDownloadUrl).not.toHaveBeenCalled();
  });
});

describe("⌘K ↔ selection contract", () => {
  it("contributes Delete selected only while a selection exists, and it deletes via the bulk path", async () => {
    deleteEntries.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    // No selection → the palette selection command is not registered.
    expect(
      getCommands().some((c) => c.id === "storage:delete-selected"),
    ).toBe(false);

    await selectFiles(user); // a.txt + b.txt

    // Selection present → the storage surface contributes the command.
    await waitFor(() =>
      expect(
        getCommands().some((c) => c.id === "storage:delete-selected"),
      ).toBe(true),
    );

    // Running it is exactly what ⌘K "Delete selected" does — it opens the bulk
    // delete dialog over the resolved selection (the palette never touches it).
    const command = getCommands().find(
      (c) => c.id === "storage:delete-selected",
    );
    act(() => command?.run?.());

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete 2 items?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteEntries).toHaveBeenCalledTimes(1));
    expect(deleteEntries.mock.calls[0]?.[0]).toEqual([
      { Key: "k/a.txt", IsDirectory: false },
      { Key: "k/b.txt", IsDirectory: false },
    ]);
  });
});
