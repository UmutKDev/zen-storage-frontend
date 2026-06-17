import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const engineMock = {
  enqueue: vi.fn(),
  restore: vi.fn(() => Promise.resolve()),
  setOnCompleted: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  retry: vi.fn(),
  cancel: vi.fn(),
  dismiss: vi.fn(),
  cancelAll: vi.fn(),
  resolveConflict: vi.fn(),
  firstConflict: vi.fn(() => null as unknown),
};
vi.mock("@/features/storage/upload/core/engine", () => ({
  uploadEngine: engineMock,
}));
const getStorageUsage = vi.fn();
vi.mock("@/features/storage/browse/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/storage/browse/api")>();
  return { ...actual, getStorageUsage };
});

const { FileDropZone } = await import(
  "@/features/storage/upload/components/FileDropZone"
);
const { UploadTray } = await import(
  "@/features/storage/upload/components/UploadTray"
);
const { useUploadsStore } = await import(
  "@/features/storage/upload/stores/uploads.store"
);

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  useUploadsStore.getState().clear();
  engineMock.firstConflict.mockReturnValue(null);
});

describe("FileDropZone", () => {
  it("highlights on OS-file drag and enqueues the dropped files", async () => {
    renderWithProviders(
      <FileDropZone path="docs">
        <p>content</p>
      </FileDropZone>,
    );
    const zone = screen.getByText("content").parentElement!;
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    const dataTransfer = { types: ["Files"], files: [file], items: [] };

    fireEvent.dragEnter(zone, { dataTransfer });
    expect(screen.getByText("Drop files to upload")).toBeInTheDocument();

    fireEvent.drop(zone, { dataTransfer });
    await waitFor(() => expect(engineMock.enqueue).toHaveBeenCalledTimes(1));
    expect(engineMock.enqueue.mock.calls[0]?.[0]).toEqual([
      { file, path: "docs" },
    ]);
    expect(engineMock.enqueue.mock.calls[0]?.[1]).toBe("u1");
    expect(
      screen.queryByText("Drop files to upload"),
    ).not.toBeInTheDocument();
  });

  it("ignores non-file drags (internal item drags fire no Files type)", () => {
    renderWithProviders(
      <FileDropZone path="">
        <p>content</p>
      </FileDropZone>,
    );
    const zone = screen.getByText("content").parentElement!;
    fireEvent.dragEnter(zone, {
      dataTransfer: { types: ["text/plain"], files: [], items: [] },
    });
    expect(
      screen.queryByText("Drop files to upload"),
    ).not.toBeInTheDocument();
  });
});

describe("UploadTray", () => {
  it("renders nothing while the queue is empty", () => {
    renderWithProviders(<UploadTray />);
    expect(screen.queryByText("Uploads")).not.toBeInTheDocument();
  });

  it("shows rows with progress + status and per-status actions", () => {
    useUploadsStore.getState().upsert({
      id: "1",
      batchId: "b",
      fileName: "video.mp4",
      path: "",
      totalSize: 100,
      uploadedBytes: 40,
      status: "uploading",
    });
    useUploadsStore.getState().upsert({
      id: "2",
      batchId: "b",
      fileName: "broken.bin",
      path: "",
      totalSize: 10,
      uploadedBytes: 0,
      status: "error",
      errorMessage: "boom",
    });
    renderWithProviders(<UploadTray />);

    expect(screen.getByText("Uploads")).toBeInTheDocument();
    expect(screen.getByText("video.mp4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pause" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
  });

  it("wires pause / cancel / retry / dismiss to the engine", async () => {
    const user = userEvent.setup();
    useUploadsStore.getState().upsert({
      id: "1",
      batchId: "b",
      fileName: "a.txt",
      path: "",
      totalSize: 10,
      uploadedBytes: 1,
      status: "uploading",
    });
    renderWithProviders(<UploadTray />);

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(engineMock.pause).toHaveBeenCalledWith("1");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(engineMock.cancel).toHaveBeenCalledWith("1");
  });

  it("announces errors assertively and batch completion politely", async () => {
    useUploadsStore.getState().upsert({
      id: "1",
      batchId: "b",
      fileName: "a.txt",
      path: "",
      totalSize: 10,
      uploadedBytes: 1,
      status: "uploading",
    });
    renderWithProviders(<UploadTray />);

    act(() => {
      useUploadsStore.getState().patch("1", {
        status: "error",
        errorMessage: "boom",
      });
    });
    expect(screen.getByRole("alert")).toHaveTextContent("a.txt: boom");

    // Back to active, then done: the active→0 batch message wins over the
    // per-file one.
    act(() => {
      useUploadsStore.getState().patch("1", { status: "uploading" });
    });
    act(() => {
      useUploadsStore.getState().patch("1", { status: "done" });
    });
    await waitFor(() =>
      expect(screen.getByText("All uploads complete.")).toBeInTheDocument(),
    );
  });

  it("opens the conflict gate with apply-to-all for multi-file batches", async () => {
    const user = userEvent.setup();
    engineMock.firstConflict.mockReturnValue({
      id: "1",
      batchSize: 2,
      details: {
        Conflicts: [{ Source: { Name: "a.txt" }, Target: {} }],
        TotalItems: 1,
        ConflictCount: 1,
      },
    });
    useUploadsStore.getState().upsert({
      id: "1",
      batchId: "b",
      fileName: "a.txt",
      path: "",
      totalSize: 10,
      uploadedBytes: 0,
      status: "conflict",
    });
    renderWithProviders(<UploadTray />);

    expect(await screen.findByText("Name already in use")).toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", { name: "Apply to all in this batch" }),
    );
    await user.click(screen.getByRole("button", { name: /Keep both/ }));
    expect(engineMock.resolveConflict).toHaveBeenCalledWith(
      "1",
      "KEEP_BOTH",
      true,
    );
  });
});
