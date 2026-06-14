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

const { VersionHistoryRail } = await import(
  "@/features/preview/components/VersionHistoryRail"
);

const version = (id: string, isLatest = false) => ({
  VersionId: id,
  Key: "k/doc.txt",
  Size: 100,
  LastModified: "2026-01-01T10:00:00Z",
  IsLatest: isLatest,
  ETag: id,
});

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
});
afterEach(() => useWorkspaceStore.getState().reset());

describe("VersionHistoryRail", () => {
  it("fetches versions on mount (the rail tab is the disclosure)", async () => {
    listVersions.mockResolvedValue({
      Key: "k/doc.txt",
      Versions: [version("v1", true), version("v2")],
    });
    renderWithProviders(<VersionHistoryRail previewKey="k/doc.txt" />);

    await waitFor(() => expect(listVersions).toHaveBeenCalledTimes(1));
    // Latest version shows a "current" badge and offers no actions.
    expect(await screen.findByText("Current")).toBeInTheDocument();
  });

  it("restores an older version after confirm", async () => {
    listVersions.mockResolvedValue({
      Key: "k/doc.txt",
      Versions: [version("v1", true), version("v2")],
    });
    restoreVersion.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<VersionHistoryRail previewKey="k/doc.txt" />);

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
    renderWithProviders(<VersionHistoryRail previewKey="k/doc.txt" />);

    expect(
      await screen.findByText(/no previous versions/i),
    ).toBeInTheDocument();
  });
});
