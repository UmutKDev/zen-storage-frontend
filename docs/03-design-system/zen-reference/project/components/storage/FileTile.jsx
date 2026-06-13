import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Checkbox } from "../core/Checkbox.jsx";
import { formatBytes, fileMeta } from "./format.js";

/**
 * Smart-grid tile. With `thumb`, renders the thumbnail full-bleed at its
 * natural aspect ratio (pass `ratio` = width/height); without, renders a
 * square icon tile (folders, docs). Place inside <SmartGrid> — the tile
 * publishes its ratio to the layout via the --zs-ratio CSS var.
 * Protected state rides on the icon tile — never badges: encrypted docks
 * a lock chip on the tile corner (open lock once unlocked); hidden renders
 * ghosted with dashed borders. Locked tiles can't be selected, but onOpen
 * STILL fires so the app can prompt for a password (see UnlockDialog).
 */
export function FileTile({
  name,
  kind = "file",
  thumb,
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
  style,
}) {
  const isDir = kind === "dir";
  const meta = fileMeta(name, kind);
  const isMedia = Boolean(thumb);
  const isVideo = meta.icon === "film";
  const r = isMedia ? ratio || 4 / 3 : 1;
  const stateClasses = [
    isMedia ? "zs-tile--thumb" : "zs-tile--plain",
    selected ? "zs-tile--selected" : "",
    selecting ? "zs-tile--selecting" : "",
    locked ? "zs-tile--locked" : "",
    hidden ? "zs-tile--hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const baseLine =
    kind === "file"
      ? `${meta.label} · ${formatBytes(size)}`
      : childCount != null
        ? `${childCount} ${childCount === 1 ? "item" : "items"}`
        : meta.label;
  const statusWords = [
    encrypted ? (locked ? "Encrypted" : "Unlocked") : null,
    hidden ? "Hidden" : null,
  ].filter(Boolean);
  const metaLine = [baseLine, ...statusWords].join(" · ");
  const chip = encrypted
    ? {
        icon: locked ? "lock" : "lock-open",
        cls: " zs-status-chip--lock",
        label: locked ? "Encrypted" : "Encrypted — unlocked",
      }
    : hidden
      ? { icon: "eye-off", cls: "", label: "Hidden" }
      : null;
  return (
    <div className={`zs-tile ${stateClasses}`} style={{ "--zs-ratio": r, ...style }}>
      <div
        className="zs-tile__inner"
        role="button"
        tabIndex={0}
        onClick={() => {
          if (onOpen) onOpen();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onOpen) {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {isMedia ? (
          <>
            <img className="zs-tile__img" src={thumb} alt="" loading="lazy" draggable={false} />
            {isVideo ? (
              <span className="zs-tile__play" aria-hidden="true">
                <Icon name="play" size={14} />
              </span>
            ) : null}
            <span className="zs-tile__scrim" aria-hidden="true"></span>
            <span className="zs-tile__caption">
              <span className="zs-tile__name">{name}</span>
              {duration ? <span className="zs-tile__duration">{duration}</span> : null}
            </span>
          </>
        ) : (
          <>
            <span className={`zs-tile__icon${isDir ? " zs-tile__icon--folder" : ""} zs-tone-${meta.tone}`}>
              <Icon name={meta.icon} size={22} />
              {chip ? (
                <span className={`zs-status-chip${chip.cls}`} title={chip.label} aria-label={chip.label}>
                  <Icon name={chip.icon} size={10} strokeWidth={2.5} />
                </span>
              ) : null}
            </span>
            <span className="zs-tile__label">{name}</span>
            <span className="zs-tile__meta">{metaLine}</span>
          </>
        )}
      </div>
      {onToggleSelect && !locked ? (
        <Checkbox aria-label={`Select ${name}`} checked={selected} onCheckedChange={onToggleSelect} />
      ) : null}
      {onAction && !locked ? (
        <span className="zs-tile__actions">
          <button
            type="button"
            className="zs-btn zs-btn--ghost zs-btn--icon-sm"
            aria-label={`Actions for ${name}`}
            onClick={onAction}
          >
            <Icon name="more-vertical" />
          </button>
        </span>
      ) : null}
    </div>
  );
}
