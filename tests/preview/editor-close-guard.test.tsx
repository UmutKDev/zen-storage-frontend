import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const findObject = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return { ...actual, findObject };
});
vi.mock("@/features/storage", () => ({
  useDelete: () => ({ remove: vi.fn(), isPending: false }),
  useDownload: () => ({ download: vi.fn(), downloadMany: vi.fn(), isPending: false }),
  DeleteConfirmDialog: () => null,
  usePreviewNavStore: (selector: (s: { keys: string[] }) => unknown) =>
    selector({ keys: [] }),
}));

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

const { FilePreviewModal } = await import("@/features/preview");
const { useEditorStore } = await import(
  "@/features/preview/stores/editor.store"
);

const imageObject = {
  Name: "photo.jpg",
  Extension: "jpg",
  MimeType: "image/jpeg",
  Path: { Host: "cdn", Key: "k/photo.jpg", Url: "https://cdn/x" },
  LastModified: "2026-01-01",
  ETag: "e",
  Size: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  findObject.mockResolvedValue(imageObject);
});
afterEach(() => {
  useEditorStore.getState().setGuard(null);
  useWorkspaceStore.getState().reset();
});

describe("FilePreviewModal — unsaved-changes close guard", () => {
  it("intercepts close when the editor guard is dirty, then saves + navigates", async () => {
    const save = vi.fn().mockResolvedValue(true);
    const discard = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <FilePreviewModal previewKey="k/photo.jpg" mode="page" />,
    );
    await screen.findByRole("img", { name: "photo.jpg" });

    // The editor (not mounted here) would register this; set it directly.
    act(() => useEditorStore.getState().setGuard({ dirty: true, save, discard }));

    await user.click(screen.getByRole("button", { name: "Close preview" }));

    // Close is intercepted — the unsaved dialog appears instead of navigating.
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Unsaved changes")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(save).toHaveBeenCalled();
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("closes immediately when there are no unsaved changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilePreviewModal previewKey="k/photo.jpg" mode="page" />,
    );
    await screen.findByRole("img", { name: "photo.jpg" });

    await user.click(screen.getByRole("button", { name: "Close preview" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(push).toHaveBeenCalled();
  });
});
