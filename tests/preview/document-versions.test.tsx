import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const listDocumentVersions = vi.fn();
const restoreDocumentVersion = vi.fn();
const deleteDocumentVersion = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return {
    ...actual,
    listDocumentVersions,
    restoreDocumentVersion,
    deleteDocumentVersion,
  };
});

const { DocumentVersionsRail } = await import(
  "@/features/preview/components/DocumentVersionsRail"
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

describe("DocumentVersionsRail", () => {
  it("fetches document versions on mount and shows restore buttons when editable", async () => {
    renderWithProviders(
      <DocumentVersionsRail previewKey="k/doc.txt" onViewDiff={vi.fn()} />,
    );

    await waitFor(() => expect(listDocumentVersions).toHaveBeenCalledTimes(1));
    expect(
      await screen.findAllByRole("button", { name: /^Restore —/ }),
    ).toHaveLength(2);
  });

  it("hides restore/delete when the editor is read-only, but keeps the diff button", async () => {
    useEditorStore.getState().setCanEdit(false);
    renderWithProviders(
      <DocumentVersionsRail previewKey="k/doc.txt" onViewDiff={vi.fn()} />,
    );

    await waitFor(() => expect(listDocumentVersions).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /^Restore —/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Delete —/ })).toBeNull();
    expect(
      (await screen.findAllByRole("button", { name: /view changes/i })).length,
    ).toBeGreaterThan(0);
  });

  it("opens the diff on the stage via onViewDiff (not inline in the rail)", async () => {
    const onViewDiff = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DocumentVersionsRail previewKey="k/doc.txt" onViewDiff={onViewDiff} />,
    );

    const diffButtons = await screen.findAllByRole("button", {
      name: /view changes/i,
    });
    await user.click(diffButtons[0]);

    expect(onViewDiff).toHaveBeenCalledWith("k/doc.txt", "v1");
  });

  it("restores a version after confirm", async () => {
    restoreDocumentVersion.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <DocumentVersionsRail previewKey="k/doc.txt" onViewDiff={vi.fn()} />,
    );

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
