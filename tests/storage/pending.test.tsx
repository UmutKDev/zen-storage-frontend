import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import { useViewPrefs } from "@/features/storage/browse/stores/viewPrefs.store";
import type { Job } from "@/features/jobs";

const getDirectories = vi.fn();
const getObjects = vi.fn();
const getStorageUsage = vi.fn();

vi.mock("@/features/storage/browse/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/storage/browse/api")>();
  return { ...actual, getDirectories, getObjects, getStorageUsage };
});

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
// Imported AFTER the api mock — the operations barrel pulls in browse/api, which
// must already be mocked (and its spies initialized) before this module loads.
const { usePendingOpsStore } = await import("@/features/storage/operations");
const { useJobsStore } = await import("@/features/jobs");

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
const job = (over: Partial<Job> & Pick<Job, "id" | "kind" | "title">): Job => ({
  status: "running",
  phaseRank: 0,
  percentage: 0,
  path: "",
  createdAt: 1,
  updatedAt: 1,
  ...over,
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
  usePendingOpsStore.setState({ ops: {} });
  useJobsStore.setState({ jobs: {} });
  getStorageUsage.mockResolvedValue(usage);
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
  usePendingOpsStore.setState({ ops: {} });
  useJobsStore.setState({ jobs: {} });
});

describe("StorageBrowser pending rows", () => {
  it("shows an optimistic pending row for an in-flight folder create", async () => {
    getDirectories.mockResolvedValue([dir("Existing")]);
    getObjects.mockResolvedValue([]);
    usePendingOpsStore
      .getState()
      .add({ id: "op1", path: "", name: "New Folder", kind: "create-folder" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("New Folder")).toBeInTheDocument();
    expect(screen.getByText("Creating folder…")).toBeInTheDocument();
    // The real listing still renders alongside the pending row.
    expect(screen.getByText("Existing")).toBeInTheDocument();
  });

  it("shows a pending row even when the folder is otherwise empty", async () => {
    getDirectories.mockResolvedValue([]);
    getObjects.mockResolvedValue([]);
    usePendingOpsStore
      .getState()
      .add({ id: "op1", path: "", name: "New Folder", kind: "create-folder" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("New Folder")).toBeInTheDocument();
    // Not the empty-folder state — a create is in flight.
    expect(
      screen.queryByText("This folder is empty"),
    ).not.toBeInTheDocument();
  });

  it("shows a durable pending row (with progress) for a running archive extract here", async () => {
    getDirectories.mockResolvedValue([]);
    getObjects.mockResolvedValue([]);
    useJobsStore.setState({
      jobs: {
        j1: job({
          id: "j1",
          kind: "archive-extract",
          // The title is the archive's name (which archive is extracting); the
          // action label moves to the secondary line.
          title: "movie.zip",
          percentage: 42,
          path: "",
        }),
      },
    });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("movie.zip")).toBeInTheDocument();
    expect(screen.getByText("Extracting archive")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("ignores jobs in other folders and non-inline job kinds", async () => {
    getDirectories.mockResolvedValue([]);
    getObjects.mockResolvedValue([]);
    useJobsStore.setState({
      jobs: {
        other: job({
          id: "other",
          kind: "archive-extract",
          title: "Elsewhere",
          path: "sub",
        }),
        scan: job({
          id: "scan",
          kind: "duplicate-scan",
          title: "Scanning",
          path: "",
        }),
      },
    });
    usePendingOpsStore
      .getState()
      .add({ id: "op1", path: "", name: "Only This", kind: "create-folder" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("Only This")).toBeInTheDocument();
    expect(screen.queryByText("Elsewhere")).not.toBeInTheDocument(); // other folder
    expect(screen.queryByText("Scanning")).not.toBeInTheDocument(); // whole-storage scan
  });

  it("does not show pending rows while searching", async () => {
    getDirectories.mockResolvedValue([dir("Existing")]);
    getObjects.mockResolvedValue([file("report.txt", 1)]);
    usePendingOpsStore
      .getState()
      .add({ id: "op1", path: "", name: "New Folder", kind: "create-folder" });
    mockSearchParams = new URLSearchParams({ q: "report", scope: "current" });

    renderWithProviders(<StorageBrowser path="" />);

    expect(await screen.findByText("report.txt")).toBeInTheDocument();
    expect(screen.queryByText("New Folder")).not.toBeInTheDocument();
  });
});
