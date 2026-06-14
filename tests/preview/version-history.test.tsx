import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const listVersions = vi.fn();
const restoreVersion = vi.fn();
const deleteVersion = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return { ...actual, listVersions, restoreVersion, deleteVersion };
});

const { VersionHistoryPanel } = await import(
  "@/features/preview/components/VersionHistoryPanel"
);

const version = (id: string, isLatest = false) => ({
  VersionId: id,
  Key: "k/doc.txt",
  Size: 100,
  LastModified: "2026-01-01T10:00:00Z",
  IsLatest: isLatest,
  ETag: id,
});

const panelToggle = () =>
  screen.getByRole("button", { name: /version history/i });

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
});
afterEach(() => useWorkspaceStore.getState().reset());

describe("VersionHistoryPanel", () => {
  it("is collapsed by default and fetches versions only on expand", async () => {
    listVersions.mockResolvedValue({
      Key: "k/doc.txt",
      Versions: [version("v1", true), version("v2")],
    });
    const user = userEvent.setup();
    renderWithProviders(<VersionHistoryPanel previewKey="k/doc.txt" />);

    expect(listVersions).not.toHaveBeenCalled();
    expect(panelToggle()).toHaveAttribute("aria-expanded", "false");

    await user.click(panelToggle());

    await waitFor(() => expect(listVersions).toHaveBeenCalledTimes(1));
    expect(panelToggle()).toHaveAttribute("aria-expanded", "true");
    // Latest version shows a "current" badge and offers no actions.
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("restores an older version after confirm", async () => {
    listVersions.mockResolvedValue({
      Key: "k/doc.txt",
      Versions: [version("v1", true), version("v2")],
    });
    restoreVersion.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<VersionHistoryPanel previewKey="k/doc.txt" />);

    await user.click(panelToggle());
    await screen.findByText("Current");

    await user.click(screen.getByRole("button", { name: /^Restore —/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Restore" }));

    await waitFor(() =>
      expect(restoreVersion).toHaveBeenCalledWith({
        Key: "k/doc.txt",
        VersionId: "v2",
      }),
    );
  });

  it("shows the empty state when there are no versions", async () => {
    listVersions.mockResolvedValue({ Key: "k/doc.txt", Versions: [] });
    const user = userEvent.setup();
    renderWithProviders(<VersionHistoryPanel previewKey="k/doc.txt" />);

    await user.click(panelToggle());

    expect(
      await screen.findByText(/no previous versions/i),
    ).toBeInTheDocument();
  });
});
