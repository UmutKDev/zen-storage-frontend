import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";

const ZS_DOC_FORMATS = [
  { ext: "txt", label: "Plain text" },
  { ext: "md", label: "Markdown" },
  { ext: "html", label: "HTML" },
  { ext: "csv", label: "CSV" },
  { ext: "json", label: "JSON" },
];

/**
 * Create-document surface ("New → Document"). The name field carries a live
 * extension suffix; format chips swap it. The footer previews the final
 * filename in mono. `onCreate` receives { name, format } — name WITHOUT
 * extension; the final filename is `${name}.${format}`.
 */
export function NewDocumentDialog({
  open,
  onClose,
  destination,
  onCreate,
  formats = ZS_DOC_FORMATS,
  initialName = "",
  initialFormat = "txt",
}) {
  const [name, setName] = React.useState(initialName);
  const [format, setFormat] = React.useState(initialFormat);
  const nameRef = React.useRef(null);

  // Reset + focus every time the dialog opens
  React.useEffect(() => {
    if (!open) return undefined;
    setName(initialName);
    setFormat(initialFormat);
    const t = setTimeout(() => {
      if (nameRef.current) nameRef.current.focus();
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
  const fileName = (name.trim() || "untitled") + "." + format;
  const submit = () => {
    if (valid && onCreate) onCreate({ name: name.trim(), format });
  };

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="zs-create glass-overlay" role="dialog" aria-modal="true" aria-label="New document">
        <header className="zs-create__head">
          <span className="zs-create__emblem" aria-hidden="true">
            <Icon name="file-plus" size={18} />
          </span>
          <div className="zs-create__heading">
            <h2 className="zs-create__title">New document</h2>
            <p className="zs-create__sub">
              {destination ? (
                <>
                  In <strong>{destination}</strong>
                </>
              ) : (
                "Create a text document"
              )}
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
            <label className="zs-label" htmlFor="zs-newdoc-name">Name</label>
            <div className="zs-create__field zs-create__field--suffix">
              <input
                id="zs-newdoc-name"
                ref={nameRef}
                className="zs-input"
                placeholder="Untitled"
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
            <Icon name="file-text" size={13} /> {fileName}
          </span>
          <div className="zs-create__actions">
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={!valid} onClick={submit}>Create</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
