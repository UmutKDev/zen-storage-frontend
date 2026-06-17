import React from "react";
import { Icon } from "../core/Icon.jsx";

/**
 * Floating bulk-selection bar (mirror of BulkActionBar.tsx). Solid elevated
 * pill, bottom-center. Move / Archive / Download / Delete over the selected
 * entries (Archive renders only when `onArchive` is provided; Extract only
 * when `onExtract` is — pass it when the selection holds archives).
 */
export function BulkActionBar({
  count,
  allSelected = false,
  canDownload = true,
  onSelectAll,
  onMove,
  onArchive,
  onExtract,
  onDownload,
  onDelete,
  onClear,
}) {
  if (!count) return null;
  return (
    <div className="zs-bulkbar">
      <span className="zs-bulkbar__count">{count} selected</span>
      {allSelected || !onSelectAll ? null : (
        <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={onSelectAll}>
          Select all
        </button>
      )}
      <span className="zs-bulkbar__sep" aria-hidden="true"></span>
      <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={onMove}>
        <Icon name="folder-input" /> Move
      </button>
      {onArchive ? (
        <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={onArchive}>
          <Icon name="archive" /> Archive
        </button>
      ) : null}
      {onExtract ? (
        <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={onExtract}>
          <Icon name="archive-restore" /> Extract
        </button>
      ) : null}
      <button
        type="button"
        className="zs-btn zs-btn--ghost zs-btn--sm"
        aria-disabled={!canDownload}
        style={!canDownload ? { opacity: 0.5 } : undefined}
        title={!canDownload ? "No files in the selection" : undefined}
        onClick={() => {
          if (canDownload && onDownload) onDownload();
        }}
      >
        <Icon name="download" /> Download
      </button>
      <button type="button" className="zs-btn zs-btn--ghost-destructive zs-btn--sm" onClick={onDelete}>
        <Icon name="trash-2" /> Delete
      </button>
      <span className="zs-bulkbar__sep" aria-hidden="true"></span>
      <button
        type="button"
        className="zs-btn zs-btn--ghost zs-btn--icon-sm"
        aria-label="Clear selection"
        onClick={onClear}
      >
        <Icon name="x" />
      </button>
    </div>
  );
}
