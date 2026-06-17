import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import { useViewPrefs } from "@/features/storage/browse/stores/viewPrefs.store";

const getDirectories = vi.fn();
const getObjects = vi.fn();
const getStorageUsage = vi.fn();
const getSearch = vi.fn();

vi.mock("@/features/storage/browse/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/storage/browse/api")>();
  return { ...actual, getDirectories, getObjects, getStorageUsage, getSearch };
});

// A no-op router + a configurable `?q=&scope=` so the URL stays the single source
// of truth for the rendered search mode (mirrors how the real screen reads it).
// `mock`-prefixed so Vitest's hoist check allows referencing it in the factory.
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/storage",
  useSearchParams: () => mockSearchParams,
}));

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
  Extension: name.split(".").pop() ?? "",
  MimeType: "text/plain",
  Path: { Host: "", Key: `k/${name}`, Url: "" },
  Size: size,
  LastModified: "2026-01-01",
  ETag: "e",
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams();
  useWorkspaceStore.getState().setOwner("u1");
  useViewPrefs.setState({
    view: "list",
    sortKey: "name",
    sortDir: "asc",
    filterType: "all",
    filterExt: "",
  });
  getStorageUsage.mockResolvedValue(usage);
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
});

describe("StorageBrowser search", () => {
  it('"This folder" filters the loaded listing client-side, with no API call', async () => {
    getDirectories.mockResolvedValue([dir("Photos")]);
    getObjects.mockResolvedValue([file("report.txt", 1), file("notes.txt", 2)]);
    mockSearchParams = new URLSearchParams({ q: "report", scope: "current" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("report.txt")).toBeInTheDocument();
    // Non-matching folder + file are filtered out locally.
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
    expect(screen.queryByText("Photos")).not.toBeInTheDocument();
    // The whole point: an in-folder search never round-trips.
    expect(getSearch).not.toHaveBeenCalled();
  });

  it('"This folder" offers an "everywhere" escalation when nothing matches', async () => {
    getDirectories.mockResolvedValue([]);
    getObjects.mockResolvedValue([file("notes.txt", 1)]);
    mockSearchParams = new URLSearchParams({ q: "report", scope: "current" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Search everywhere" }),
    ).toBeInTheDocument();
    expect(getSearch).not.toHaveBeenCalled();
  });

  it('"Everywhere" escalates to the Cloud/Search API', async () => {
    getDirectories.mockResolvedValue([dir("Photos")]);
    getObjects.mockResolvedValue([file("local.txt", 1)]);
    getSearch.mockResolvedValue({
      Directories: [],
      Objects: [file("deep-report.txt", 9)],
    });
    mockSearchParams = new URLSearchParams({ q: "report", scope: "global" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("deep-report.txt")).toBeInTheDocument();
    await waitFor(() => expect(getSearch).toHaveBeenCalled());
    // A global search shows server results, not the current folder's local files.
    expect(screen.queryByText("local.txt")).not.toBeInTheDocument();
  });

  it('"This folder" offers Clear-filter (not "No matches") when the active filter hides a name-match', async () => {
    getDirectories.mockResolvedValue([]);
    // "report.txt" matches the query by name but is a text file, hidden by the
    // active Images filter — so it's filter-suppressed, not a true no-match.
    getObjects.mockResolvedValue([file("report.txt", 1)]);
    useViewPrefs.setState({ filterType: "image" });
    mockSearchParams = new URLSearchParams({ q: "report", scope: "current" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("No matching items")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear filter" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(getSearch).not.toHaveBeenCalled();
  });

  it('"Everywhere" offers Clear-filter when the filter hides all global results', async () => {
    getDirectories.mockResolvedValue([]);
    getObjects.mockResolvedValue([]);
    getSearch.mockResolvedValue({
      Directories: [],
      Objects: [file("report.txt", 1)], // a text file, hidden by Images filter
    });
    useViewPrefs.setState({ filterType: "image" });
    mockSearchParams = new URLSearchParams({ q: "report", scope: "global" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("No matching items")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear filter" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(getSearch).toHaveBeenCalled());
  });

  it("does not announce a result count while the folder is still loading", async () => {
    getDirectories.mockReturnValue(new Promise(() => {})); // never resolves
    getObjects.mockReturnValue(new Promise(() => {}));
    mockSearchParams = new URLSearchParams({ q: "report", scope: "current" });

    renderWithProviders(<StorageBrowser path="" />);

    // The skeleton is shown; the polite live region must NOT announce "0 results"
    // over it (premature/misleading for a screen-reader user).
    expect(await screen.findByLabelText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText(/results?/i)).not.toBeInTheDocument();
  });
});
