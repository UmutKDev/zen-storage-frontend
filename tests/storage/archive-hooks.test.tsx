import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/service/factories", () => ({
  cloudArchiveApiFactory: {
    archiveCreateStart: vi.fn(),
    archiveExtractStart: vi.fn(),
    archivePreview: vi.fn(),
  },
}));

import { cloudArchiveApiFactory } from "@/service/factories";
import { useJobsStore } from "@/features/jobs";
import { useArchiveCreate } from "@/features/storage/archive/hooks/useArchiveCreate";
import { useArchiveExtract } from "@/features/storage/archive/hooks/useArchiveExtract";
import type { FolderEntry } from "@/features/storage/browse/lib/entries";

const createStartMock = vi.mocked(cloudArchiveApiFactory.archiveCreateStart);
const extractStartMock = vi.mocked(cloudArchiveApiFactory.archiveExtractStart);

const dirEntry = { kind: "dir", key: "Docs", name: "Docs" } as unknown as FolderEntry;
const fileEntry = {
  kind: "file",
  key: "a.txt",
  name: "a.txt",
} as unknown as FolderEntry;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useJobsStore.getState().reset();
});
afterEach(cleanup);

describe("useArchiveCreate.start", () => {
  it("sends dir keys with a trailing slash, trims the name, and tracks the job", async () => {
    createStartMock.mockResolvedValueOnce({ data: { JobId: "job-1" } } as never);
    const { result } = renderHook(() => useArchiveCreate("docs"), { wrapper });

    let ok = false;
    await act(async () => {
      ok = await result.current.start([dirEntry, fileEntry], {
        format: "zip",
        outputName: "  my zip  ",
      });
    });

    expect(ok).toBe(true);
    expect(createStartMock).toHaveBeenCalledWith({
      cloudArchiveCreateStartRequestModel: {
        Keys: ["Docs/", "a.txt"],
        Format: "zip",
        OutputName: "my zip",
      },
    });
    expect(useJobsStore.getState().jobs["job-1"]?.kind).toBe("archive-create");
  });

  it("omits an empty output name and refuses an empty selection", async () => {
    createStartMock.mockResolvedValueOnce({ data: { JobId: "job-x" } } as never);
    const { result } = renderHook(() => useArchiveCreate("docs"), { wrapper });

    let okEmpty = true;
    await act(async () => {
      okEmpty = await result.current.start([], { format: "zip" });
    });
    expect(okEmpty).toBe(false);
    expect(createStartMock).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.start([fileEntry], {
        format: "tar",
        outputName: "   ",
      });
    });
    expect(createStartMock).toHaveBeenCalledWith({
      cloudArchiveCreateStartRequestModel: {
        Keys: ["a.txt"],
        Format: "tar",
        OutputName: undefined,
      },
    });
  });
});

describe("useArchiveExtract.start", () => {
  it("forwards Strategy + selected entries + CreateFolder and tracks the job", async () => {
    extractStartMock.mockResolvedValueOnce({ data: { JobId: "job-2" } } as never);
    const { result } = renderHook(
      () => useArchiveExtract("docs/a.zip", "a.zip", "docs", false),
      { wrapper },
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.start({
        selectedEntries: ["docs/photo.jpg"],
        strategy: "KEEP_BOTH",
        createFolder: false,
      });
    });

    expect(ok).toBe(true);
    expect(extractStartMock).toHaveBeenCalledWith({
      cloudArchiveExtractStartRequestModel: {
        Key: "docs/a.zip",
        SelectedEntries: ["docs/photo.jpg"],
        Strategy: "KEEP_BOTH",
        CreateFolder: false,
      },
    });
    expect(useJobsStore.getState().jobs["job-2"]?.kind).toBe("archive-extract");
  });
});
