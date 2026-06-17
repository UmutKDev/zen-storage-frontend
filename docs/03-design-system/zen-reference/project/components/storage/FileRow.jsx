import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Checkbox } from "../core/Checkbox.jsx";
import { formatBytes, formatDate, fileMeta } from "./format.js";

/**
 * List-view row for the storage browser (mirror of BrowseRow.tsx).
 * Two-line layout: name + kind label. Icon tile is tinted per file type
 * (see fileMeta). Folders tint --brand and can show a child count.
 * Protected state rides on the icon tile — never name-line badges:
 * encrypted docks a small lock chip on the tile corner (open lock once
 * unlocked); hidden renders ghosted with a dashed tile + eye-off chip.
 * Locked rows can't be selected, but onOpen STILL fires so the app can
 * prompt for a password (see UnlockDialog).
 * Checkbox + actions fade in on hover.
 * `task` swaps the kind line for an inline operation readout — label +
 * tabular percent over a thin brand rail (extract queue). progress == null
 * renders the queued state: dimmed sweeping rail segment.
 */
export function FileRow({
  name,
  kind = "file",
  size,
  modified,
  childCount,
  encrypted = false,
  hidden = false,
  locked = false,
  selected = false,
  selecting = false,
  dropTarget = false,
  task,
  onOpen,
  onToggleSelect,
  onAction,
  onDownload,
}) {
  const isDir = kind === "dir";
  const meta = fileMeta(name, kind);
  const stateClasses = [
    selected ? "zs-file-row--selected" : "",
    selecting ? "zs-file-row--selecting" : "",
    locked ? "zs-file-row--locked" : "",
    hidden ? "zs-file-row--hidden" : "",
    dropTarget ? "zs-file-row--drop" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const baseLine =
    isDir && childCount != null
      ? `${meta.label} · ${childCount} ${childCount === 1 ? "item" : "items"}`
      : meta.label;
  const statusWords = [
    encrypted ? (locked ? "Encrypted" : "Unlocked") : null,
    hidden ? "Hidden" : null,
  ].filter(Boolean);
  const kindLine = [baseLine, ...statusWords].join(" · ");
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
    <div className={`zs-file-row${stateClasses ? " " + stateClasses : ""}`}>
      {onToggleSelect && !locked ? (
        <Checkbox aria-label={`Select ${name}`} checked={selected} onCheckedChange={onToggleSelect} />
      ) : (
        <span aria-hidden="true" style={{ width: 16, flexShrink: 0 }}></span>
      )}
      <a
        className="zs-file-row__main"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onOpen) onOpen();
        }}
      >
        <span className={`zs-file-row__icon${isDir ? " zs-file-row__icon--folder" : ""} zs-tone-${meta.tone}`}>
          <Icon name={meta.icon} size={20} />
          {chip ? (
            <span className={`zs-status-chip${chip.cls}`} title={chip.label} aria-label={chip.label}>
              <Icon name={chip.icon} size={10} strokeWidth={2.5} />
            </span>
          ) : null}
        </span>
        <span className="zs-file-row__text">
          <span className="zs-file-row__nameline">
            <span className="zs-file-row__name">{name}</span>
          </span>
          {task ? (
            <span className="zs-file-row__task">
              <span className="zs-file-row__task-line">
                <span className="zs-file-row__task-label">{task.label}</span>
                {task.progress != null ? (
                  <span className="zs-file-row__task-pct">{Math.round(task.progress)}%</span>
                ) : null}
              </span>
              <span
                className="zs-file-row__rail"
                role="progressbar"
                aria-label={task.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={task.progress != null ? Math.round(task.progress) : undefined}
              >
                <span
                  className={"zs-file-row__fill" + (task.progress == null ? " zs-file-row__fill--wait" : "")}
                  style={task.progress != null ? { width: Math.max(task.progress, 2) + "%" } : undefined}
                ></span>
              </span>
            </span>
          ) : (
            <span className="zs-file-row__kind">{kindLine}</span>
          )}
        </span>
        <span className="zs-file-row__size">{kind === "file" ? formatBytes(size) : "\u2014"}</span>
        <span className="zs-file-row__date">{kind === "file" ? formatDate(modified) : "\u2014"}</span>
      </a>
      <span className="zs-file-row__actions">
        {!locked && onDownload && kind === "file" ? (
          <button
            type="button"
            className="zs-btn zs-btn--ghost zs-btn--icon-sm"
            aria-label={`Download ${name}`}
            onClick={onDownload}
          >
            <Icon name="download" />
          </button>
        ) : null}
        {!locked && onAction ? (
          <button
            type="button"
            className="zs-btn zs-btn--ghost zs-btn--icon-sm"
            aria-label={`Actions for ${name}`}
            onClick={onAction}
          >
            <Icon name="more-vertical" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
