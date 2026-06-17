"use client";

import { cn, fileMeta, formatBytes, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";
import { EntryStatusChip, entryStatus } from "./EntryStatusChip";

/**
 * The visual content of a smart-grid tile — rendered INSIDE the `.zs-tile__inner`
 * surface owned by {@link TileCard} (which carries the interactivity). With a
 * `thumbnailUrl` it's a full-bleed image + bottom name scrim (images only, v1);
 * otherwise a square tinted icon tile (folders / docs / video / other files) with
 * the protected-state chip docked on the icon corner.
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
