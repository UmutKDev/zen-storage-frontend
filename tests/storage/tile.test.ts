import { describe, expect, it } from "vitest";
import { resolveTileMedia } from "@/features/storage/browse/lib/tile";
import type { FolderEntry } from "@/features/storage/browse/lib/entries";

/** rowHeight 168 → folder cell height = min(360, round(168 * 1.5)) = 252. */
const ROW = 168;
const CELL_H = 252;

const thumb = (name: string) =>
  ({
    Name: name,
    Extension: name.split(".").pop() ?? "",
    MimeType: "image/jpeg",
    Path: { Host: "", Key: `k/${name}`, Url: `https://cdn/${name}` },
    Size: 1,
    LastModified: "2026-01-01",
    ETag: "e",
  }) as never;

const dirEntry = (
  thumbnails: unknown[] | undefined,
  flags: Partial<{ IsEncrypted: boolean; IsHidden: boolean }> = {},
): FolderEntry =>
  ({
    kind: "dir",
    key: "Photos/",
    name: "Photos",
    dir: {
      Name: "Photos",
      Prefix: "Photos/",
      IsEncrypted: false,
      IsLocked: false,
      IsHidden: false,
      IsConcealed: false,
      Thumbnails: thumbnails,
      ...flags,
    },
  }) as never;

const fileEntry = (name: string): FolderEntry =>
  ({
    kind: "file",
    key: `k/${name}`,
    name,
    file: {
      Name: name,
      Extension: name.split(".").pop() ?? "",
      MimeType: "image/jpeg",
      Path: { Host: "", Key: `k/${name}`, Url: `https://cdn/${name}` },
      Metadata: { Width: "800", Height: "600" },
      Size: 1,
      LastModified: "2026-01-01",
      ETag: "e",
    },
  }) as never;

describe("resolveTileMedia — folder mosaic", () => {
  it("returns up to 4 CDN-scaled image thumbnails for an ordinary folder", () => {
    const media = resolveTileMedia(
      dirEntry([
        thumb("a.jpg"),
        thumb("b.png"),
        thumb("c.webp"),
        thumb("d.jpg"),
        thumb("e.jpg"),
        thumb("f.jpg"),
      ]),
      ROW,
    );
    expect(media.ratio).toBe(1);
    expect(media.url).toBeUndefined();
    expect(media.thumbnails).toHaveLength(4);
    expect(media.thumbnails?.[0]).toBe(`https://cdn/a.jpg?h=${CELL_H}`);
  });

  it("keeps every backend image format (bmp/tiff not dropped) but excludes a stray video", () => {
    const media = resolveTileMedia(
      dirEntry([
        thumb("a.jpg"),
        thumb("b.bmp"),
        thumb("c.tiff"),
        thumb("clip.mp4"),
      ]),
      ROW,
    );
    expect(media.thumbnails).toEqual([
      `https://cdn/a.jpg?h=${CELL_H}`,
      `https://cdn/b.bmp?h=${CELL_H}`,
      `https://cdn/c.tiff?h=${CELL_H}`,
    ]);
  });

  it("skips a thumbnail that has no URL", () => {
    const noUrl = {
      Name: "ghost.jpg",
      Extension: "jpg",
      MimeType: "image/jpeg",
      Path: { Host: "", Key: "k/ghost.jpg", Url: "" },
      Size: 1,
      LastModified: "2026-01-01",
      ETag: "e",
    } as never;
    const media = resolveTileMedia(dirEntry([noUrl, thumb("pic.jpg")]), ROW);
    expect(media.thumbnails).toEqual([`https://cdn/pic.jpg?h=${CELL_H}`]);
  });

  it("falls back to an icon tile for encrypted folders", () => {
    const media = resolveTileMedia(
      dirEntry([thumb("a.jpg")], { IsEncrypted: true }),
      ROW,
    );
    expect(media).toEqual({ ratio: 1 });
  });

  it("falls back to an icon tile for hidden folders", () => {
    const media = resolveTileMedia(
      dirEntry([thumb("a.jpg")], { IsHidden: true }),
      ROW,
    );
    expect(media).toEqual({ ratio: 1 });
  });

  it("falls back to an icon tile when a folder has no thumbnails", () => {
    expect(resolveTileMedia(dirEntry(undefined), ROW)).toEqual({ ratio: 1 });
    expect(resolveTileMedia(dirEntry([]), ROW)).toEqual({ ratio: 1 });
  });

  it("still resolves a file image to a single url (regression)", () => {
    const media = resolveTileMedia(fileEntry("shot.jpg"), ROW);
    expect(media.url).toBeDefined();
    expect(media.thumbnails).toBeUndefined();
  });
});
