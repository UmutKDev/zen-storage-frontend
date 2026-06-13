import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { Checkbox } from "../core/Checkbox.jsx";

/**
 * Create-directory surface ("New → Directory"). Same sectioned chrome as the
 * unlock gate. The Encrypted option arms a password: the header emblem flips
 * from a machined neutral disc to the orange lock, a password field rises in,
 * and the footer shows the cipher note. The Hidden option conceals the folder
 * until the ⇧⇧ reveal gate. `onCreate` receives
 * { name, encrypted, password, hidden } — the parent owns the actual creation.
 */
export function NewFolderDialog({
  open,
  onClose,
  destination,
  onCreate,
  initialName = "",
  initialEncrypted = false,
  initialHidden = false,
}) {
  const [name, setName] = React.useState(initialName);
  const [encrypted, setEncrypted] = React.useState(initialEncrypted);
  const [hidden, setHidden] = React.useState(initialHidden);
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const nameRef = React.useRef(null);
  const pwRef = React.useRef(null);

  // Reset + focus every time the dialog opens
  React.useEffect(() => {
    if (!open) return undefined;
    setName(initialName);
    setEncrypted(initialEncrypted);
    setHidden(initialHidden);
    setPassword("");
    setShow(false);
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

  const valid = name.trim().length > 0 && (!encrypted || password.length > 0);
  const submit = () => {
    if (!valid) return;
    if (onCreate)
      onCreate({ name: name.trim(), encrypted, password: encrypted ? password : undefined, hidden });
  };
  const toggleEncrypted = (next) => {
    setEncrypted(next);
    if (next)
      setTimeout(() => {
        if (pwRef.current) pwRef.current.focus();
      }, 0);
  };

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="zs-create glass-overlay" role="dialog" aria-modal="true" aria-label="New directory">
        <header className="zs-create__head">
          <span
            className={`zs-create__emblem${encrypted ? " zs-create__emblem--armed" : ""}`}
            aria-hidden="true"
          >
            <Icon name={encrypted ? "folder-lock" : "folder-plus"} size={18} />
          </span>
          <div className="zs-create__heading">
            <h2 className="zs-create__title">New directory</h2>
            <p className="zs-create__sub">
              {destination ? (
                <>
                  In <strong>{destination}</strong>
                </>
              ) : (
                "Create a folder"
              )}
              {encrypted ? " · end-to-end encrypted" : ""}
              {hidden ? " · hidden" : ""}
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
            <label className="zs-label" htmlFor="zs-newdir-name">Name</label>
            <input
              id="zs-newdir-name"
              ref={nameRef}
              className="zs-input"
              placeholder="Untitled folder"
              autoComplete="off"
              spellCheck={false}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div
            className={`zs-create__option${encrypted ? " zs-create__option--on" : ""}`}
            onClick={() => toggleEncrypted(!encrypted)}
          >
            <Checkbox checked={encrypted} onCheckedChange={toggleEncrypted} aria-label="Encrypted" />
            <span className="zs-create__option-text">
              <span className="zs-create__option-label">Encrypted</span>
              <span className="zs-create__option-sub">Asks for a password every time it’s opened.</span>
            </span>
            <span className="zs-create__option-glyph" aria-hidden="true">
              <Icon name={encrypted ? "lock" : "lock-open"} size={15} />
            </span>
          </div>

          {encrypted ? (
            <div className="zs-create__reveal">
              <label className="zs-label" htmlFor="zs-newdir-pw">Password</label>
              <div className="zs-create__field">
                <input
                  id="zs-newdir-pw"
                  ref={pwRef}
                  className="zs-input"
                  type={show ? "text" : "password"}
                  placeholder="Folder password"
                  autoComplete="new-password"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="zs-create__eye">
                  <button
                    type="button"
                    className="zs-btn zs-btn--ghost zs-btn--icon-sm"
                    aria-label={show ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    onClick={() => {
                      setShow((s) => !s);
                      if (pwRef.current) pwRef.current.focus();
                    }}
                  >
                    <Icon name={show ? "eye-off" : "eye"} size={15} />
                  </button>
                </span>
              </div>
              <p className="zs-hint">There’s no recovery — only this password opens the folder.</p>
            </div>
          ) : null}

          <div
            className={`zs-create__option${hidden ? " zs-create__option--on" : ""}`}
            onClick={() => setHidden((h) => !h)}
          >
            <Checkbox checked={hidden} onCheckedChange={setHidden} aria-label="Hidden" />
            <span className="zs-create__option-text">
              <span className="zs-create__option-label">Hidden</span>
              <span className="zs-create__option-sub">Invisible until revealed with ⇧⇧ and the password gate.</span>
            </span>
            <span className="zs-create__option-glyph" aria-hidden="true">
              <Icon name={hidden ? "eye-off" : "eye"} size={15} />
            </span>
          </div>
          <button type="submit" style={{ display: "none" }} aria-hidden="true"></button>
        </form>

        <footer className="zs-create__foot">
          {encrypted ? (
            <span className="zs-create__cipher">
              <Icon name="shield-check" size={13} /> AES-256 · zero-knowledge
            </span>
          ) : (
            <span></span>
          )}
          <div className="zs-create__actions">
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={!valid} onClick={submit}>Create</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
