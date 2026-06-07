import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import { useViewPrefs } from "@/features/storage/browse/stores/viewPrefs.store";

const getDirectories = vi.fn();
const getObjects = vi.fn();
const getStorageUsage = vi.fn();

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
const file = (name: string, size: number) => ({
  Name: name,
  Extension: "txt",
  MimeType: "text/plain",
  Path: { Host: "", Key: `k/${name}`, Url: "" },
  Size: size,
  LastModified: "2026-01-01",
  ETag: "e",
});

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  useViewPrefs.setState({ view: "list", sortKey: "name", sortDir: "asc" });
  getStorageUsage.mockResolvedValue(usage);
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
});

describe("StorageBrowser", () => {
  it("renders folders, files, and the usage bar", async () => {
    getDirectories.mockResolvedValue([dir("Photos")]);
    getObjects.mockResolvedValue([file("notes.txt", 1024)]);

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("Photos")).toBeInTheDocument();
    expect(await screen.findByText("notes.txt")).toBeInTheDocument();
    expect(screen.getByText("Storage")).toBeInTheDocument();
  });

  it("shows the empty state for an empty folder", async () => {
    getDirectories.mockResolvedValue([]);
    getObjects.mockResolvedValue([]);

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("This folder is empty")).toBeInTheDocument();
  });

  it("shows an error + retry when the queries fail", async () => {
    getDirectories.mockRejectedValue(new Error("boom"));
    getObjects.mockRejectedValue(new Error("boom"));

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t load/i);
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("does not fetch while ownerId is null", async () => {
    useWorkspaceStore.getState().reset();
    getDirectories.mockResolvedValue([dir("X")]);
    getObjects.mockResolvedValue([]);

    renderWithProviders(<StorageBrowser path="" />);

    await waitFor(() => expect(getStorageUsage).not.toHaveBeenCalled());
    expect(getDirectories).not.toHaveBeenCalled();
  });

  it("switches to grid view", async () => {
    getDirectories.mockResolvedValue([dir("Photos")]);
    getObjects.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("Photos");

    await user.click(screen.getByRole("button", { name: "Grid view" }));
    expect(useViewPrefs.getState().view).toBe("grid");
    expect(screen.getByText("Photos")).toBeInTheDocument();
  });
});
