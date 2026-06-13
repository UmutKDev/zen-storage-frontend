import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";

const ZS_ARCHIVE_FORMATS = [
  { ext: "zip", label: "Universal" },
  { ext: "tar", label: "Uncompressed" },
  { ext: "tar.gz", label: "Gzip compressed" },
];

/**
 * Archive surface — compress one entry (row "Archive…") or a multi-selection
 * (bulk bar "Archive") into a single archive in the current folder. Same
 * sectioned chrome as the create dialogs: name field with live extension
 * suffix, format chips (.zip / .tar / .tar.gz), filename + item count
 * preview in the recessed foot. `onArchive` receives { name, format } —
 * name WITHOUT extension; final filename = `${name}.${format}`.
 */
export function ArchiveDialog({
  open,
  onClose,
  destination,
  items = [],
  onArchive,
  formats = ZS_ARCHIVE_FORMATS,
  initialName,
  initialFormat = "zip",
}) {
  const [name, setName] = React.useState("");
  const [format, setFormat] = React.useState(initialFormat);
  const nameRef = React.useRef(null);

  const derivedName = React.useMemo(() => {
    if (initialName) return initialName;
    if (items.length === 1) {
      const n = items[0];
      const dot = n.lastIndexOf(".");
      return dot > 0 ? n.slice(0, dot) : n;
    }
    return destination ? destination.toLowerCase().replace(/\s+/g, "-") : "archive";
  }, [initialName, items, destination]);

  // Reset + focus (text pre-selected so typing replaces) every open
  React.useEffect(() => {
    if (!open) return undefined;
    setName(derivedName);
    setFormat(initialFormat);
    const t = setTimeout(() => {
      if (nameRef.current) {
        nameRef.current.focus();
        nameRef.current.select();
      }
    }, 0);
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const valid = name.trim().length > 0;
  const fileName = (name.trim() || "archive") + "." + format;
  const summary =
    items.length === 1 ? "\u201C" + items[0] + "\u201D" : items.length + " items";
  const submit = () => {
    if (valid && onArchive) onArchive({ name: name.trim(), format });
  };

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="zs-create glass-overlay" role="dialog" aria-modal="true" aria-label="Create archive">
        <header className="zs-create__head">
          <span className="zs-create__emblem" aria-hidden="true">
            <Icon name="archive" size={18} />
          </span>
          <div className="zs-create__heading">
            <h2 className="zs-create__title">Create archive</h2>
            <p className="zs-create__sub">
              {summary}
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

        <form
          className="zs-create__body"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="zs-label" htmlFor="zs-archive-name">Name</label>
            <div className="zs-create__field zs-create__field--suffix">
              <input
                id="zs-archive-name"
                ref={nameRef}
                className="zs-input"
                placeholder="archive"
                autoComplete="off"
                spellCheck={false}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="zs-create__suffix" aria-hidden="true">.{format}</span>
            </div>
          </div>

          <div>
            <span className="zs-label">Format</span>
            <div role="radiogroup" aria-label="Format" className="zs-create__formats">
              {formats.map((f) => (
                <button
                  key={f.ext}
                  type="button"
                  role="radio"
                  aria-checked={format === f.ext}
                  className={`zs-create__chip${format === f.ext ? " zs-create__chip--on" : ""}`}
                  onClick={() => setFormat(f.ext)}
                >
                  <span className="zs-create__chip-ext">.{f.ext}</span>
                  <span className="zs-create__chip-name">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" style={{ display: "none" }} aria-hidden="true"></button>
        </form>

        <footer className="zs-create__foot">
          <span className="zs-create__preview">
            <Icon name="file-archive" size={13} /> {fileName}
            <span style={{ opacity: 0.6 }}>
              {" · "}
              {items.length === 1 ? "1 item" : items.length + " items"}
            </span>
          </span>
          <div className="zs-create__actions">
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={!valid} onClick={submit}>
              <Icon name="archive" size={14} /> Archive
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
