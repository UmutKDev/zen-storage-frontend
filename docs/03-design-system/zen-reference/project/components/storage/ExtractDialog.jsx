import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { Checkbox } from "../core/Checkbox.jsx";
import { formatBytes } from "./format.js";

const zsExtractBase = (n) => n.replace(/\.(tar\.gz|tgz|zip|tar)$/i, "");

/**
 * Extract confirmation surface. Always confirms before anything is queued.
 * Two modes by `items` length:
 * - SINGLE archive: shows the destination folder and — when `contents` is
 *   provided — an optional "Preview contents" disclosure with a checklist,
 *   so the user can extract only some top-level entries.
 * - BULK (2+ archives): an ordered list; archives extract one at a time in
 *   that order. No content preview in bulk — that is single-only.
 * `onExtract` receives { selection } — an array of chosen top-level entry
 * names ONLY when the user previewed and deselected something; undefined
 * means "extract everything".
 */
export function ExtractDialog({
  open,
  onClose,
  destination,
  items = [],
  contents,
  onExtract,
  initialPreviewOpen = false,
}) {
  const single = items.length === 1;
  const [previewOpen, setPreviewOpen] = React.useState(initialPreviewOpen);
  const [picked, setPicked] = React.useState({});

  // Reset on every open: preview collapsed, everything selected
  React.useEffect(() => {
    if (!open) return undefined;
    setPreviewOpen(initialPreviewOpen);
    const all = {};
    (contents || []).forEach((c) => { all[c.name] = true; });
    setPicked(all);
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !items.length) return null;

  const total = (contents || []).length;
  const pickedCount = Object.values(picked).filter(Boolean).length;
  const hasPreview = single && !!contents;
  const partial = hasPreview && pickedCount < total;
  const valid = !hasPreview || pickedCount > 0;
  const destFolder = single ? zsExtractBase(items[0].name) : null;
  const submit = () => {
    if (valid && onExtract) {
      onExtract({
        selection: partial
          ? (contents || []).map((c) => c.name).filter((n) => picked[n])
          : undefined,
      });
    }
  };
  const toggleAll = () => {
    const on = pickedCount < total;
    const next = {};
    (contents || []).forEach((c) => { next[c.name] = on; });
    setPicked(next);
  };

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="zs-create glass-overlay" role="dialog" aria-modal="true" aria-label="Extract archive">
        <header className="zs-create__head">
          <span className="zs-create__emblem" aria-hidden="true">
            <Icon name="archive-restore" size={18} />
          </span>
          <div className="zs-create__heading">
            <h2 className="zs-create__title">{single ? "Extract archive" : `Extract ${items.length} archives`}</h2>
            <p className="zs-create__sub">
              {single ? "\u201C" + items[0].name + "\u201D" : "One at a time, in order"}
              {destination ? (
                <>
                  {" "}in <strong>{destination}</strong>
                </>
              ) : null}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </header>

        <div className="zs-create__body">
          {single ? (
            <>
              <div className="zs-extract__dest">
                <Icon name="folder" size={15} />
                <span>
                  Into a new folder{" "}
                  <span className="zs-extract__dest-name">{destFolder}/</span>
                </span>
              </div>

              {hasPreview ? (
                <div>
                  <button
                    type="button"
                    className="zs-extract__toggle"
                    aria-expanded={previewOpen}
                    onClick={() => setPreviewOpen((o) => !o)}
                  >
                    <Icon
                      name="chevron-right"
                      size={14}
                      style={{
                        transform: previewOpen ? "rotate(90deg)" : "none",
                        transition: "transform var(--duration-fast) var(--ease-standard)",
                      }}
                    />
                    Preview contents
                    <span className="zs-extract__toggle-count">
                      {total} {total === 1 ? "item" : "items"}
                    </span>
                  </button>

                  {previewOpen ? (
                    <div className="zs-extract__panel">
                      <div className="zs-extract__list-head">
                        <Checkbox
                          aria-label="Select all contents"
                          checked={pickedCount === total}
                          onCheckedChange={toggleAll}
                        />
                        <span>
                          {pickedCount} of {total} selected
                        </span>
                      </div>
                      <ul className="zs-extract__list">
                        {(contents || []).map((c) => (
                          <li key={c.name} className="zs-extract__row">
                            <Checkbox
                              aria-label={`Extract ${c.name}`}
                              checked={!!picked[c.name]}
                              onCheckedChange={() =>
                                setPicked((p) => ({ ...p, [c.name]: !p[c.name] }))
                              }
                            />
                            <Icon
                              name={c.kind === "dir" ? "folder" : "file"}
                              size={15}
                              className={c.kind === "dir" ? "zs-extract__row-folder" : undefined}
                            />
                            <span className="zs-extract__row-name">{c.name}</span>
                            <span className="zs-extract__row-size">
                              {c.kind === "dir" ? "folder" : formatBytes(c.size)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="zs-extract__note">Contents preview isn't available for this archive.</p>
              )}
            </>
          ) : (
            <ol className="zs-extract__order">
              {items.map((it, i) => (
                <li key={it.name} className="zs-extract__row">
                  <span className="zs-extract__num">{i + 1}</span>
                  <Icon name="file-archive" size={15} />
                  <span className="zs-extract__row-name">{it.name}</span>
                  <span className="zs-extract__row-size">{formatBytes(it.size)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="zs-create__foot">
          <span className="zs-create__preview">
            {single ? (
              <>
                <Icon name="folder" size={13} /> {destFolder}/
                {hasPreview ? (
                  <span style={{ opacity: 0.6 }}>
                    {" · "}
                    {partial ? pickedCount + " of " + total + " items" : "everything"}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <Icon name="list-ordered" size={13} /> {items.length} archives
                <span style={{ opacity: 0.6 }}> · one at a time</span>
              </>
            )}
          </span>
          <div className="zs-create__actions">
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={!valid} onClick={submit}>
              <Icon name="archive-restore" size={14} /> Extract
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
