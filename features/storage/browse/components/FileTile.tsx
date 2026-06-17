"use client";

import { type CSSProperties, type SyntheticEvent } from "react";
import { Folder, Play } from "lucide-react";
import { cn, fileMeta, formatBytes, isVideo, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";
import { useVideoDims } from "../stores/videoDims.store";
import { EntryStatusChip, entryStatus } from "./EntryStatusChip";

/**
 * The visual content of a smart-grid tile — rendered INSIDE the `.zs-tile__inner`
 * surface owned by {@link TileCard} (which carries the interactivity). With a
 * `thumbnailUrl` it's a full-bleed image (or a first-frame video poster) + bottom
 * name scrim; an ordinary folder with image content gets a 2×2 {@link FolderMosaic};
 * otherwise a square tinted icon tile (folders / docs / other files) with the
 * protected-state chip docked on the icon corner.
 */
export function FileTile({
  entry,
  thumbnailUrl,
  thumbnails,
}: {
  entry: FolderEntry;
  thumbnailUrl?: string;
  thumbnails?: string[];
}) {
  const isDir = entry.kind === "dir";
  const meta = fileMeta(entry.name, entry.kind);
  const Icon = meta.icon;

  if (isDir && thumbnails && thumbnails.length > 0) {
    return <FolderMosaic name={entry.name} thumbnails={thumbnails} />;
  }

  if (thumbnailUrl) {
    if (isVideo(entry.name)) {
      return (
        <VideoTile url={thumbnailUrl} name={entry.name} entryKey={entry.key} />
      );
    }
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="zs-tile__img"
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          draggable={false}
        />
        <span className="zs-tile__scrim" aria-hidden />
        <span className="zs-tile__caption">
          <span className="zs-tile__name">{entry.name}</span>
        </span>
      </>
    );
  }

  const metaLine = isDir
    ? (entryStatus(entry)?.word ?? t("storage.fileType.folder"))
    : `${meta.label} · ${formatBytes(entry.file.Size)}`;

  return (
    <>
      <span
        className={cn(
          "zs-tile__icon",
          isDir && "zs-tile__icon--folder",
          toneClass(meta.tone),
        )}
      >
        <Icon className="size-[22px]" />
        <EntryStatusChip entry={entry} />
      </span>
      <span className="zs-tile__label">{entry.name}</span>
      <span className="zs-tile__meta">{metaLine}</span>
    </>
  );
}

/**
 * An ordinary folder's tile: a 2×2 mosaic of up to 4 child thumbnails (the
 * backend round-robins them across the folder + sub-folders) under the same
 * name scrim as an image tile, plus a small folder glyph so it still reads as a
 * folder. Square (the tile keeps `ratio: 1`); the cell grid adapts to 1–4 images:
 * 1 = full bleed, 2 = side-by-side, 3 = one tall left + two stacked right, 4 = 2×2.
 * The template is set **inline** (not via attribute-selector CSS) so the layout
 * is immune to stylesheet ordering / HMR. Decorative — {@link TileCard} owns the
 * interactivity and the accessible name comes from the caption, so it's `aria-hidden`.
 */
function FolderMosaic({
  name,
  thumbnails,
}: {
  name: string;
  thumbnails: string[];
}) {
  const cells = thumbnails.slice(0, 4);
  const n = cells.length;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: n === 1 ? "1fr" : "1fr 1fr",
    gridTemplateRows: n <= 2 ? "1fr" : "1fr 1fr",
  };
  // Inline so the layout can't be lost to stale stylesheet HMR. `minWidth/Height: 0`
  // is load-bearing: grid items default to min-size:auto (the image's intrinsic
  // size), which lets a tall photo stretch its `1fr` track past its fair half
  // (measured 792px vs 198px). Zeroing the minimums keeps every track equal and
  // `object-fit: cover` crops each photo to its square cell.
  const cellStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    objectFit: "cover",
    display: "block",
  };
  return (
    <>
      <span className="zs-folder-mosaic" style={gridStyle} aria-hidden>
        {cells.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            className="zs-folder-mosaic__img"
            // 3-up: the first cell spans both rows down the left column.
            style={n === 3 && i === 0 ? { ...cellStyle, gridRow: "span 2" } : cellStyle}
            src={url}
            alt=""
            loading="lazy"
            draggable={false}
          />
        ))}
      </span>
      <span className="zs-tile__scrim" aria-hidden />
      <span className="zs-tile__caption">
        <Folder className="zs-tile__caption-icon" aria-hidden />
        <span className="zs-tile__name">{name}</span>
      </span>
    </>
  );
}

/**
 * A muted, controls-less `<video>` that paints its first frame as a poster (the
 * grid virtualizes by row, so only on-screen video tiles ever mount and fetch).
 * The play badge + name scrim mirror the image tile. Decorative — {@link TileCard}
 * owns the interactivity, so the video is `aria-hidden` and not focusable.
 */
function VideoTile({
  url,
  name,
  entryKey,
}: {
  url: string;
  name: string;
  entryKey: string;
}) {
  const onLoadedMetadata = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    // Record the real frame size so the grid can justify the tile to it.
    useVideoDims.getState().setDims(entryKey, v.videoWidth, v.videoHeight);
    // Nudge past 0s so the browser paints a real frame — `preload="metadata"`
    // alone often leaves a blank/black poster.
    if (v.currentTime === 0) {
      try {
        v.currentTime = Math.min(0.1, (v.duration || 1) / 2);
      } catch {
        /* seeking unsupported (e.g. a live stream) — keep the default frame */
      }
    }
  };
  return (
    <>
      <video
        className="zs-tile__img"
        src={url}
        muted
        playsInline
        preload="metadata"
        draggable={false}
        tabIndex={-1}
        aria-hidden
        onLoadedMetadata={onLoadedMetadata}
      />
      <span className="zs-tile__scrim" aria-hidden />
      <span className="zs-tile__play" aria-hidden>
        <Play className="size-4" />
      </span>
      <span className="zs-tile__caption">
        <span className="zs-tile__name">{name}</span>
      </span>
    </>
  );
}
