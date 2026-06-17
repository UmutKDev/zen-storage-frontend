"use client";

import { type SyntheticEvent } from "react";
import { Play } from "lucide-react";
import { cn, fileMeta, formatBytes, isVideo, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";
import { useVideoDims } from "../stores/videoDims.store";
import { EntryStatusChip, entryStatus } from "./EntryStatusChip";

/**
 * The visual content of a smart-grid tile — rendered INSIDE the `.zs-tile__inner`
 * surface owned by {@link TileCard} (which carries the interactivity). With a
 * `thumbnailUrl` it's a full-bleed image (or a first-frame video poster) + bottom
 * name scrim; otherwise a square tinted icon tile (folders / docs / other files)
 * with the protected-state chip docked on the icon corner.
 */
export function FileTile({
  entry,
  thumbnailUrl,
}: {
  entry: FolderEntry;
  thumbnailUrl?: string;
}) {
  const isDir = entry.kind === "dir";
  const meta = fileMeta(entry.name, entry.kind);
  const Icon = meta.icon;

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
