import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const findObject = vi.fn();
const getShareUrl = vi.fn();

// Mutable nav-key list the storage mock reads (set per test).
const { navKeys } = vi.hoisted(() => ({ navKeys: { current: [] as string[] } }));

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return { ...actual, findObject, getShareUrl };
});

// The toolbar reuses storage's delete/download + the nav store reads the
// previewable-key list; stub the barrel so the modal test stays isolated from
// the storage import graph (the reuse wiring is type-checked by tsc).
vi.mock("@/features/storage", () => ({
  useDelete: () => ({ remove: vi.fn().mockResolvedValue(true), isPending: false }),
  useDownload: () => ({ download: vi.fn(), downloadMany: vi.fn(), isPending: false }),
  DeleteConfirmDialog: () => null,
  usePreviewNavStore: (selector: (s: { keys: string[] }) => unknown) =>
    selector({ keys: navKeys.current }),
}));

const { FilePreviewModal } = await import("@/features/preview");

const imageObject = (over: Record<string, unknown> = {}) => ({
  Name: "photo.jpg",
  Extension: "jpg",
  MimeType: "image/jpeg",
  Path: {
    Host: "cdn",
    Key: "k/photo.jpg",
    Url: "https://cdn.storage.umutk.me/k/photo.jpg",
  },
  Metadata: { Originalfilename: "photo.jpg", Width: "800", Height: "600" },
  LastModified: "2026-01-01",
  ETag: "e",
  Size: 1234,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  navKeys.current = [];
  useWorkspaceStore.getState().setOwner("u1");
});
afterEach(() => useWorkspaceStore.getState().reset());

describe("FilePreviewModal", () => {
  it("resolves the file and renders a CDN-scaled image", async () => {
    findObject.mockResolvedValue(imageObject());

    renderWithProviders(
      <FilePreviewModal previewKey="k/photo.jpg" mode="page" />,
    );

    const img = await screen.findByRole("img", { name: "photo.jpg" });
    expect(img.getAttribute("src")).toBe(
      "https://cdn.storage.umutk.me/k/photo.jpg?w=800",
    );
  });

  it("shares via the clipboard when Web Share is unavailable", async () => {
    findObject.mockResolvedValue(imageObject());
    getShareUrl.mockResolvedValue("https://cdn.storage.umutk.me/s?token=abc");
    const user = userEvent.setup();
    // After setup() (which installs its own clipboard stub): force the clipboard
    // fallback (some envs define navigator.share) + a spy we control.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(
      <FilePreviewModal previewKey="k/photo.jpg" mode="page" />,
    );
    await screen.findByRole("img", { name: "photo.jpg" });

    await user.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "https://cdn.storage.umutk.me/s?token=abc",
      ),
    );
  });

  it("shows an error + retry when the file can't be resolved", async () => {
    findObject.mockRejectedValue(new Error("boom"));

    renderWithProviders(<FilePreviewModal previewKey="k/x.jpg" mode="page" />);

    expect(
      await screen.findByText(/couldn’t load this file/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("navigates ←/→ in place — swaps the file via history, not a route change", async () => {
    navKeys.current = ["k/photo.jpg", "k/next.png"];
    findObject.mockImplementation((key: string) =>
      Promise.resolve(
        imageObject(
          key === "k/next.png"
            ? {
                Name: "next.png",
                Extension: "png",
                Metadata: undefined,
                Path: {
                  Host: "cdn",
                  Key: "k/next.png",
                  Url: "https://cdn.storage.umutk.me/k/next.png",
                },
              }
            : {},
        ),
      ),
    );
    const replaceState = vi.spyOn(window.history, "replaceState");
    const user = userEvent.setup();

    renderWithProviders(<FilePreviewModal previewKey="k/photo.jpg" mode="page" />);
    await screen.findByRole("img", { name: "photo.jpg" });

    await user.keyboard("{ArrowRight}");

    // The next file resolves + the URL is updated IN PLACE (history.replaceState,
    // not a Next route push — so the dialog never remounts).
    await waitFor(() =>
      expect(findObject).toHaveBeenCalledWith("k/next.png", expect.anything()),
    );
    expect(
      replaceState.mock.calls.some(
        (c) => c[2] === "/storage/preview/k%2Fnext.png",
      ),
    ).toBe(true);
    expect(
      await screen.findByRole("img", { name: "next.png" }),
    ).toBeInTheDocument();
    replaceState.mockRestore();
  });

  it("falls back to the unsupported view for non-previewable files", async () => {
    findObject.mockResolvedValue(
      imageObject({
        Name: "archive.zip",
        Extension: "zip",
        Metadata: undefined,
        Path: {
          Host: "cdn",
          Key: "k/archive.zip",
          Url: "https://cdn.storage.umutk.me/k/archive.zip",
        },
      }),
    );

    renderWithProviders(
      <FilePreviewModal previewKey="k/archive.zip" mode="page" />,
    );

    expect(await screen.findByText(/no preview available/i)).toBeInTheDocument();
  });
});
