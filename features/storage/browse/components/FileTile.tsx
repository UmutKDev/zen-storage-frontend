"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { EyeOff, Lock, LockOpen, MoreVertical, Play } from "lucide-react";
import { cn, fileMeta, formatBytes, isVideo, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Checkbox } from "@/components/ui";

export interface FileTileProps {
  name: string;
  kind?: "dir" | "file";
  /** Present → renders the thumbnail full-bleed (image/video). */
  thumbnailUrl?: string;
  /** width / height — drives the justified row. Defaults to 4/3 for media. */
  ratio?: number;
  size?: number;
  childCount?: number;
  duration?: string;
  encrypted?: boolean;
  hidden?: boolean;
  locked?: boolean;
  selected?: boolean;
  /** True while any selection exists (keeps the checkbox visible). */
  selecting?: boolean;
  onOpen?: () => void;
  onToggleSelect?: () => void;
  onAction?: (e: MouseEvent) => void;
}

/**
 * Smart-grid tile. With `thumbnailUrl`, renders the thumbnail full-bleed at its
 * natural aspect ratio; without, a square tinted icon tile (folders, docs).
 * Protected state rides on the icon tile as a corner chip — never badges.
 * Locked tiles can't be selected, but `onOpen` STILL fires so the app can
 * prompt for a password. Place inside <SmartGrid>.
 */
export function FileTile({
  name,
  kind = "file",
  thumbnailUrl,
  ratio,
  size,
  childCount,
  duration,
  encrypted = false,
  hidden = false,
  locked = false,
  selected = false,
  selecting = false,
  onOpen,
  onToggleSelect,
  onAction,
}: FileTileProps) {
  const isDir = kind === "dir";
  const meta = fileMeta(name, kind);
  const Icon = meta.icon;
  const isMedia = Boolean(thumbnailUrl);
  const video = isVideo(name);
  const aspect = isMedia ? (ratio ?? 4 / 3) : 1;

  const baseLine =
    kind === "file"
      ? size != null
        ? `${meta.label} · ${formatBytes(size)}`
        : meta.label
      : childCount != null
        ? `${childCount} ${t("storage.ops.bulk.itemsSuffix")}`
        : meta.label;
  const statusWords = [
    encrypted
      ? locked
        ? t("storage.status.encrypted")
        : t("storage.status.unlocked")
      : null,
    hidden ? t("storage.status.hidden") : null,
  ].filter(Boolean);
  const metaLine = [baseLine, ...statusWords].join(" · ");

  const ChipIcon = encrypted ? (locked ? Lock : LockOpen) : hidden ? EyeOff : null;
  const chipLabel = encrypted
    ? locked
      ? t("storage.status.encryptedLabel")
      : t("storage.status.unlockedLabel")
    : hidden
      ? t("storage.status.hiddenLabel")
      : "";

  const open = () => onOpen?.();
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <div
      className={cn(
        "zs-tile",
        isMedia ? "zs-tile--thumb" : "zs-tile--plain",
        selected && "zs-tile--selected",
        selecting && "zs-tile--selecting",
        locked && "zs-tile--locked",
        hidden && "zs-tile--hidden",
      )}
      style={{ "--zs-ratio": aspect } as CSSProperties}
    >
      <div
        className="zs-tile__inner"
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={onKeyDown}
      >
        {isMedia ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="zs-tile__img"
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              draggable={false}
            />
            {video ? (
              <span className="zs-tile__play" aria-hidden>
                <Play className="size-[14px]" />
              </span>
            ) : null}
            <span className="zs-tile__scrim" aria-hidden />
            <span className="zs-tile__caption">
              <span className="zs-tile__name">{name}</span>
              {duration ? (
                <span className="zs-tile__duration">{duration}</span>
              ) : null}
            </span>
          </>
        ) : (
          <>
            <span
              className={cn(
                "zs-tile__icon",
                isDir && "zs-tile__icon--folder",
                toneClass(meta.tone),
              )}
            >
              <Icon className="size-[22px]" />
              {ChipIcon ? (
                <span
                  className={cn(
                    "zs-status-chip",
                    encrypted && "zs-status-chip--lock",
                  )}
                  role="img"
                  aria-label={chipLabel}
                >
                  <ChipIcon />
                </span>
              ) : null}
            </span>
            <span className="zs-tile__label">{name}</span>
            <span className="zs-tile__meta">{metaLine}</span>
          </>
        )}
      </div>
      {onToggleSelect && !locked ? (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${t("storage.ops.selection.select")} ${name}`}
        />
      ) : null}
      {onAction && !locked ? (
        <span className="zs-tile__actions">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${t("storage.ops.menu.actions")} ${name}`}
            onClick={onAction}
          >
            <MoreVertical />
          </Button>
        </span>
      ) : null}
    </div>
  );
}
