import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

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

function renderRail() {
  return renderWithProviders(
    <PreviewDetailsRail
      open
      activeTab="details"
      onTabChange={vi.fn()}
      previewKey="k/photo.jpg"
      object={object}
      isEditor={false}
      onViewDiff={vi.fn()}
    />,
  );
}

beforeEach(() => useWorkspaceStore.getState().setOwner("u1"));
afterEach(() => useWorkspaceStore.getState().reset());

describe("PreviewDetailsRail — Details tab", () => {
  it("shows real metadata and never a fabricated integrity/sha256 row", () => {
    renderRail();
    // Real, backend-provided values only.
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText(/1\.2 KB/)).toBeInTheDocument();
    expect(screen.getByText("Modified")).toBeInTheDocument();
    // No fabricated security/integrity data.
    expect(screen.queryByText(/sha256/i)).toBeNull();
    expect(screen.queryByText(/encrypted at rest/i)).toBeNull();
  });
});
