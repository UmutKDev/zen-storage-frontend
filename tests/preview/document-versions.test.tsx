import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const listDocumentVersions = vi.fn();
const restoreDocumentVersion = vi.fn();
const deleteDocumentVersion = vi.fn();
const diffDocumentVersions = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return {
    ...actual,
    listDocumentVersions,
    restoreDocumentVersion,
    deleteDocumentVersion,
    diffDocumentVersions,
  };
});

const { DocumentVersionsPanel } = await import(
  "@/features/preview/components/DocumentVersionsPanel"
);
const { useEditorStore } = await import(
  "@/features/preview/stores/editor.store"
);

const version = (id: string) => ({
  VersionId: id,
  Key: "k/doc.txt",
  Size: 100,
  LastModified: "2026-01-01T10:00:00Z",
  IsLatest: false,
  ETag: id,
});

const panelToggle = () =>
  screen.getByRole("button", { name: /version history/i });

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  useEditorStore.getState().setCanEdit(true);
  listDocumentVersions.mockResolvedValue({
    Key: "k/doc.txt",
    Versions: [version("v1"), version("v2")],
  });
});
afterEach(() => {
  useEditorStore.getState().setCanEdit(false);
  useWorkspaceStore.getState().reset();
});

describe("DocumentVersionsPanel", () => {
  it("is collapsed by default and fetches document versions only on expand", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersionsPanel previewKey="k/doc.txt" />);

    expect(listDocumentVersions).not.toHaveBeenCalled();
    await user.click(panelToggle());

    await waitFor(() =>
      expect(listDocumentVersions).toHaveBeenCalledTimes(1),
    );
    expect(screen.getAllByRole("button", { name: /^Restore —/ })).toHaveLength(
      2,
    );
  });

  it("hides restore/delete when the editor is read-only, but keeps the diff toggle", async () => {
    useEditorStore.getState().setCanEdit(false);
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersionsPanel previewKey="k/doc.txt" />);

    await user.click(panelToggle());
    await waitFor(() => expect(listDocumentVersions).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: /^Restore —/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Delete —/ })).toBeNull();
    expect(
      screen.getAllByRole("button", { name: /view changes/i }).length,
    ).toBeGreaterThan(0);
  });

  it("expands a backend-computed diff on the view-changes toggle", async () => {
    diffDocumentVersions.mockResolvedValue({
      Key: "k/doc.txt",
      SourceVersionId: "v1",
      TargetVersionId: "current",
      Hunks: [
        {
          OldStart: 1,
          OldLines: 1,
          NewStart: 1,
          NewLines: 1,
          Lines: ["+hello"],
        },
      ],
      Stats: { Additions: 1, Deletions: 0, Changes: 1 },
    });
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersionsPanel previewKey="k/doc.txt" />);

    await user.click(panelToggle());
    const diffButtons = await screen.findAllByRole("button", {
      name: /view changes/i,
    });
    await user.click(diffButtons[0]);

    await waitFor(() => expect(diffDocumentVersions).toHaveBeenCalled());
    expect(await screen.findByText("+hello")).toBeInTheDocument();
  });

  it("offers a retry when the diff fails to load", async () => {
    diffDocumentVersions.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersionsPanel previewKey="k/doc.txt" />);

    await user.click(panelToggle());
    const diffButtons = await screen.findAllByRole("button", {
      name: /view changes/i,
    });
    await user.click(diffButtons[0]);

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("restores a version after confirm", async () => {
    restoreDocumentVersion.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersionsPanel previewKey="k/doc.txt" />);

    await user.click(panelToggle());
    const restoreButtons = await screen.findAllByRole("button", {
      name: /^Restore —/,
    });
    await user.click(restoreButtons[0]);

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Restore" }));

    await waitFor(() =>
      expect(restoreDocumentVersion).toHaveBeenCalledWith({
        Key: "k/doc.txt",
        VersionId: "v1",
      }),
    );
  });
});
