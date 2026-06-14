import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";
import type { ScanGate } from "@/features/preview/hooks/useScanStatus";

// The rail footer reuses storage's download; isolate the storage import graph.
vi.mock("@/features/storage", () => ({
  useDownload: () => ({ download: vi.fn(), downloadMany: vi.fn(), isPending: false }),
}));

const { PreviewDetailsRail } = await import(
  "@/features/preview/components/PreviewDetailsRail"
);

const object = {
  Name: "photo.jpg",
  Extension: "jpg",
  MimeType: "image/jpeg",
  Path: { Host: "cdn", Key: "k/photo.jpg", Url: "https://cdn/k/photo.jpg" },
  Metadata: { Originalfilename: "photo.jpg", Width: "800", Height: "600" },
  LastModified: "2026-01-01T10:00:00Z",
  ETag: "e",
  Size: 1234,
} as never;

function renderRail(gate: ScanGate) {
  return renderWithProviders(
    <PreviewDetailsRail
      open
      activeTab="details"
      onTabChange={vi.fn()}
      previewKey="k/photo.jpg"
      object={object}
      gate={gate}
      isEditor={false}
      onViewDiff={vi.fn()}
    />,
  );
}

beforeEach(() => useWorkspaceStore.getState().setOwner("u1"));
afterEach(() => useWorkspaceStore.getState().reset());

describe("PreviewDetailsRail — Details tab", () => {
  it("shows real metadata and never a fabricated integrity/sha256 row", () => {
    renderRail("clean");
    // Real, backend-provided values only.
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText(/1\.2 KB/)).toBeInTheDocument();
    expect(screen.getByText("Modified")).toBeInTheDocument();
    // No fabricated security/integrity data.
    expect(screen.queryByText(/sha256/i)).toBeNull();
    expect(screen.queryByText(/encrypted at rest/i)).toBeNull();
  });

  it("maps the AV gate to a scan line", () => {
    const { unmount } = renderRail("clean");
    expect(screen.getByText(/no threats found/i)).toBeInTheDocument();
    unmount();

    renderRail("pending");
    expect(screen.getByText(/scanning for threats/i)).toBeInTheDocument();
  });

  it("flags an infected file in the scan line", () => {
    renderRail("infected");
    expect(screen.getByText(/threat found/i)).toBeInTheDocument();
  });

  it("renders no scan line when the status is unknown (no data to assert)", () => {
    renderRail("unknown");
    expect(screen.queryByText(/no threats found/i)).toBeNull();
    expect(screen.queryByText(/scanning for threats/i)).toBeNull();
    expect(screen.queryByText(/threat found/i)).toBeNull();
  });
});
