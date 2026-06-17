import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import { useViewPrefs } from "@/features/storage/browse/stores/viewPrefs.store";
import { useSelectionStore } from "@/features/storage/operations/stores/selection.store";

// Capture router.push so we can assert a plain file click opens the preview
// (Phase 4). usePathname/useSearchParams stay real (read from the test-utils
// context providers).
const push = vi.fn();
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({
      push,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
  };
});

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
const dir = (name: string, locked = false) => ({
  Name: name,
  Prefix: `${name}/`,
  IsEncrypted: false,
  IsLocked: locked,
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

// Sorted folders-first order: Archive/, Photos/, Vault/(locked), a.txt, b.txt
beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  useViewPrefs.setState({ view: "list", sortKey: "name", sortDir: "asc" });
  useSelectionStore.getState().clear();
  getStorageUsage.mockResolvedValue(usage);
  getDirectories.mockResolvedValue([
    dir("Photos"),
    dir("Archive"),
    dir("Vault", true),
  ]);
  getObjects.mockResolvedValue([file("a.txt"), file("b.txt")]);
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
});

const checkbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` });

describe("multi-select", () => {
  it("selects via checkboxes and shows the bulk bar count", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("a.txt"));
    expect(await screen.findAllByText(/1 selected/)).not.toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Clear selection" }),
    ).toBeInTheDocument();

    await user.click(checkbox("Archive"));
    expect(await screen.findAllByText(/2 selected/)).not.toHaveLength(0);
  });

  it("plain click on a file opens the preview, leaving selection untouched", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(screen.getByText("a.txt"));

    // Navigates to the preview deep link; does NOT select the file (selection
    // is now a checkbox / modifier-click gesture).
    expect(push).toHaveBeenCalledWith("/storage/preview/k%2Fa.txt");
    expect(checkbox("a.txt")).not.toBeChecked();
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it("ctrl/cmd-click toggles items into the selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.keyboard("{Control>}");
    await user.click(screen.getByText("a.txt"));
    await user.click(screen.getByText("b.txt"));
    await user.keyboard("{/Control}");

    expect(checkbox("a.txt")).toBeChecked();
    expect(checkbox("b.txt")).toBeChecked();
  });

  it("shift-click selects the range over the folders-first order, skipping locked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("Archive")); // anchor
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("a.txt"));
    await user.keyboard("{/Shift}");

    // Archive → Photos → (Vault locked, skipped) → a.txt
    expect(checkbox("Archive")).toBeChecked();
    expect(checkbox("Photos")).toBeChecked();
    expect(checkbox("a.txt")).toBeChecked();
    expect(checkbox("b.txt")).not.toBeChecked();
    expect(screen.getAllByText(/3 selected/)).not.toHaveLength(0);
  });

  it("select-all skips locked dirs (no checkbox rendered for them)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    expect(
      screen.queryByRole("checkbox", { name: "Select Vault" }),
    ).not.toBeInTheDocument();

    await user.keyboard("{Control>}a{/Control}");
    expect(await screen.findAllByText(/4 selected/)).not.toHaveLength(0);
    // everything selectable is selected → no "Select all" affordance
    expect(
      screen.queryByRole("button", { name: "Select all" }),
    ).not.toBeInTheDocument();
  });

  it("Escape clears the selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("a.txt"));
    expect(screen.getAllByText(/1 selected/)).not.toHaveLength(0);

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByText(/1 selected/)).not.toBeInTheDocument(),
    );
    expect(checkbox("a.txt")).not.toBeChecked();
  });

  it("selection survives the list↔grid toggle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("a.txt"));
    await user.click(checkbox("Archive"));
    await user.click(screen.getByRole("button", { name: "Grid view" }));

    expect(useViewPrefs.getState().view).toBe("grid");
    expect(screen.getAllByText(/2 selected/)).not.toHaveLength(0);
  });

  it("clears the selection when the folder changes", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<StorageBrowser path="" />);
    await screen.findByText("a.txt");

    await user.click(checkbox("a.txt"));
    expect(useSelectionStore.getState().selectedKeys.size).toBe(1);

    rerender(<StorageBrowser path="docs" />);
    await waitFor(() =>
      expect(useSelectionStore.getState().selectedKeys.size).toBe(0),
    );
  });
});
