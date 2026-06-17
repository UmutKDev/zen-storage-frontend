import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Checkbox } from "../core/Checkbox.jsx";
import { formatBytes, fileMeta } from "./format.js";

/**
 * Grid-view card for the storage browser (mirror of BrowseCard.tsx).
 * Protected state rides on the icon tile — never badges: encrypted docks
 * a lock chip on the tile corner (open lock once unlocked); hidden renders
 * ghosted with dashed borders. Locked cards can't be selected, but onOpen
 * STILL fires so the app can prompt for a password (see UnlockDialog).
 */
export function FileCard({
  name,
  kind = "file",
  size,
  childCount,
  encrypted = false,
  hidden = false,
  locked = false,
  selected = false,
  selecting = false,
  dropTarget = false,
  onOpen,
  onToggleSelect,
  onAction,
  style,
}) {
  const isDir = kind === "dir";
  const meta = fileMeta(name, kind);
  const stateClasses = [
    selected ? "zs-file-card--selected" : "",
    selecting ? "zs-file-card--selecting" : "",
    locked ? "zs-file-card--locked" : "",
    hidden ? "zs-file-card--hidden" : "",
    dropTarget ? "zs-file-card--drop" : "",
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
    <div className={`zs-file-card${stateClasses ? " " + stateClasses : ""}`} style={style}>
      <div
        className="zs-file-card__inner"
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
        <span className={`zs-file-card__icon${isDir ? " zs-file-card__icon--folder" : ""} zs-tone-${meta.tone}`}>
          <Icon name={meta.icon} size={40} />
          {chip ? (
            <span className={`zs-status-chip${chip.cls}`} title={chip.label} aria-label={chip.label}>
              <Icon name={chip.icon} size={10} strokeWidth={2.5} />
            </span>
          ) : null}
        </span>
        <span className="zs-file-card__name">{name}</span>
        <span className="zs-file-card__meta">{metaLine}</span>
      </div>
      {onToggleSelect && !locked ? (
        <Checkbox aria-label={`Select ${name}`} checked={selected} onCheckedChange={onToggleSelect} />
      ) : null}
      {onAction && !locked ? (
        <span className="zs-file-card__actions">
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
