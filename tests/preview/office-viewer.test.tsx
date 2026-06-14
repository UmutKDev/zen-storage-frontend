import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useWorkspaceStore } from "@/stores";

const getPresignedSrc = vi.fn();
const download = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return { ...actual, getPresignedSrc };
});
vi.mock("@/features/storage", () => ({
  useDownload: () => ({ download, downloadMany: vi.fn(), isPending: false }),
}));

const { OfficeViewer } = await import(
  "@/features/preview/components/viewers/OfficeViewer"
);

const docx = {
  Name: "report.docx",
  Extension: "docx",
  MimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  Path: { Host: "cdn", Key: "k/report.docx", Url: "https://cdn/x" },
  LastModified: "2026-01-01",
  ETag: "e",
  Size: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
});
afterEach(() => useWorkspaceStore.getState().reset());

describe("OfficeViewer", () => {
  it("renders the Microsoft embed iframe with the presigned src", async () => {
    getPresignedSrc.mockResolvedValue("https://cdn.storage.umutk.me/s?token=abc");

    renderWithProviders(<OfficeViewer object={docx as never} />);

    const frame = await screen.findByTitle("report.docx");
    expect(frame.getAttribute("src")).toBe(
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        "https://cdn.storage.umutk.me/s?token=abc",
      )}`,
    );
    expect(frame).toHaveAttribute("sandbox");
  });

  it("falls back to a download CTA when the presigned URL fails", async () => {
    getPresignedSrc.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();

    renderWithProviders(<OfficeViewer object={docx as never} />);

    expect(
      await screen.findByText(/couldn’t open this document/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(download).toHaveBeenCalledWith("k/report.docx");
  });
});
