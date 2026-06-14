import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";

const download = vi.fn();
vi.mock("@/features/storage", () => ({
  useDownload: () => ({ download, downloadMany: vi.fn(), isPending: false }),
}));

const { PdfViewer } = await import(
  "@/features/preview/components/viewers/PdfViewer"
);

// 80 MiB > the 50 MiB inline cap → fallback path, which renders without any
// network fetch (the blob path is browser-only and not exercised here).
const hugePdf = {
  Name: "huge.pdf",
  Extension: "pdf",
  MimeType: "application/pdf",
  Path: { Host: "cdn", Key: "k/huge.pdf", Url: "https://cdn/x.pdf" },
  LastModified: "2026-01-01",
  ETag: "e",
  Size: 80 * 1024 * 1024,
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("PdfViewer", () => {
  it("offers open-in-new-tab + download for PDFs over the inline size cap", () => {
    renderWithProviders(<PdfViewer object={hugePdf as never} />);
    expect(
      screen.getByRole("button", { name: "Open in new tab" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download" }),
    ).toBeInTheDocument();
  });
});
