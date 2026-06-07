import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import { ApiError } from "@/lib/api";
import type { FolderEntry } from "@/features/storage/browse/lib/entries";

const createFolder = vi.fn();
const createFile = vi.fn();
const renameFile = vi.fn();
const renameDirectory = vi.fn();
const deleteEntries = vi.fn();
const moveEntries = vi.fn();
const getDownloadUrl = vi.fn();
const getDirectories = vi.fn();

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
  return { ...actual, getDirectories };
});

const { CreateMenu } = await import(
  "@/features/storage/operations/components/CreateMenu"
);
const { EntryActionsMenu } = await import(
  "@/features/storage/operations/components/EntryActionsMenu"
);

const fileEntry: FolderEntry = {
  kind: "file",
  key: "docs/notes.txt",
  name: "notes.txt",
  file: {
    Name: "notes.txt",
    Extension: "txt",
    Path: { Host: "", Key: "docs/notes.txt", Url: "" },
    Size: 10,
    LastModified: "2026-01-01",
    ETag: "e",
  } as never,
};

function conflictError() {
  return new ApiError({
    code: "CONFLICT",
    messages: [],
    raw: {
      Status: {
        Messages: [
          {
            Conflicts: [{ Source: { Name: "Reports" }, Target: {} }],
            TotalItems: 1,
            ConflictCount: 1,
          },
        ],
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
});

describe("CreateMenu", () => {
  it("creates a folder with the trailing-slash path", async () => {
    createFolder.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<CreateMenu path="docs" />);

    await user.click(screen.getByRole("button", { name: "New" }));
    await user.click(screen.getByRole("menuitem", { name: "New folder" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Folder name"), "Reports");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createFolder).toHaveBeenCalled());
    expect(createFolder.mock.calls[0]?.[0]).toMatchObject({ Path: "docs/Reports/" });
  });

  it("routes a name clash through the conflict prompt and retries with REPLACE", async () => {
    createFolder
      .mockRejectedValueOnce(conflictError())
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<CreateMenu path="" />);

    await user.click(screen.getByRole("button", { name: "New" }));
    await user.click(screen.getByRole("menuitem", { name: "New folder" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Folder name"), "Reports");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    // conflict prompt appears
    expect(
      await screen.findByText("Name already in use"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Replace/ }));

    await waitFor(() => expect(createFolder).toHaveBeenCalledTimes(2));
    expect(createFolder.mock.calls[1]?.[0]).toMatchObject({
      ConflictStrategy: "REPLACE",
    });
  });
});

describe("EntryActionsMenu", () => {
  it("renames a file via update", async () => {
    renameFile.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<EntryActionsMenu entry={fileEntry} path="docs" />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText("New name");
    await user.clear(input);
    await user.type(input, "renamed.txt");
    await user.click(within(dialog).getByRole("button", { name: "Rename" }));

    await waitFor(() => expect(renameFile).toHaveBeenCalled());
    expect(renameFile.mock.calls[0]?.[0]).toMatchObject({
      Key: "docs/notes.txt",
      Name: "renamed.txt",
    });
  });

  it("deletes a file via Items[{Key,IsDirectory:false}]", async () => {
    deleteEntries.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<EntryActionsMenu entry={fileEntry} path="docs" />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteEntries).toHaveBeenCalled());
    expect(deleteEntries.mock.calls[0]?.[0]).toEqual([
      { Key: "docs/notes.txt", IsDirectory: false },
    ]);
  });

  it("downloads a file via a presigned URL", async () => {
    getDownloadUrl.mockResolvedValue("https://signed.example/x");
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    renderWithProviders(<EntryActionsMenu entry={fileEntry} path="docs" />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Download" }));

    await waitFor(() =>
      expect(getDownloadUrl).toHaveBeenCalledWith("docs/notes.txt"),
    );
    openSpy.mockRestore();
  });

  it("moves a file to root via the picker", async () => {
    moveEntries.mockResolvedValue(undefined);
    getDirectories.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<EntryActionsMenu entry={fileEntry} path="docs" />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Move here" }));

    await waitFor(() => expect(moveEntries).toHaveBeenCalled());
    expect(moveEntries.mock.calls[0]?.[0]).toMatchObject({
      items: [{ Key: "docs/notes.txt", IsDirectory: false }],
      destinationKey: "/",
    });
  });
});
