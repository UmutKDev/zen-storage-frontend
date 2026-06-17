import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";

/**
 * Password gate for protected content. Two variants:
 * - "folder": opens when an encrypted folder is clicked; unlock to enter.
 * - "hidden": opens on the double-Shift (⇧⇧) reveal gesture; unlock to
 *   show hidden items.
 * Same sectioned chrome as the upload surface: machined emblem header,
 * password field with show/hide toggle, encrypted footer. The parent owns
 * the secret via `verify(password)`; a wrong password shakes the panel and
 * shows an inline error. On success `onUnlock` fires — close + proceed there.
 */
export function UnlockDialog({
  open,
  onClose,
  variant = "folder",
  name,
  verify,
  onUnlock,
  hint,
}) {
  const [value, setValue] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [shaking, setShaking] = React.useState(false);
  const inputRef = React.useRef(null);

  // Reset + focus every time the gate opens
  React.useEffect(() => {
    if (open) {
      setValue("");
      setShow(false);
      setError(false);
      setShaking(false);
      const t = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isHidden = variant === "hidden";
  const submit = () => {
    if (verify && verify(value)) {
      if (onUnlock) onUnlock();
      return;
    }
    setError(true);
    setShaking(true);
    setValue("");
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`zs-unlock glass-overlay${shaking ? " zs-unlock--shake" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={isHidden ? "Show hidden items" : `Unlock ${name || "folder"}`}
        onAnimationEnd={() => setShaking(false)}
      >
        <header className="zs-unlock__head">
          <span
            className={`zs-unlock__emblem${isHidden ? " zs-unlock__emblem--hidden" : ""}`}
            aria-hidden="true"
          >
            <Icon name={isHidden ? "eye-off" : "lock"} size={18} />
          </span>
          <div className="zs-unlock__heading">
            <h2 className="zs-unlock__title">
              {isHidden ? "Show hidden items" : `Unlock \u201C${name || "folder"}\u201D`}
            </h2>
            <p className="zs-unlock__sub">
              {isHidden
                ? "Hidden items stay out of sight until you confirm your password."
                : "This folder is end-to-end encrypted. Enter its password to open it."}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </header>

        <form
          className="zs-unlock__body"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="zs-unlock__field">
            <input
              ref={inputRef}
              className="zs-input"
              type={show ? "text" : "password"}
              placeholder="Password"
              autoComplete="off"
              spellCheck={false}
              aria-label="Password"
              aria-invalid={error || undefined}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
            />
            <span className="zs-unlock__eye">
              <button
                type="button"
                className="zs-btn zs-btn--ghost zs-btn--icon-sm"
                aria-label={show ? "Hide password" : "Show password"}
                tabIndex={-1}
                onClick={() => {
                  setShow((s) => !s);
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                <Icon name={show ? "eye-off" : "eye"} size={15} />
              </button>
            </span>
          </div>
          {error ? (
            <p className="zs-hint zs-hint--error">Incorrect password — try again.</p>
          ) : hint ? (
            <p className="zs-hint">{hint}</p>
          ) : null}
        </form>

        <footer className="zs-unlock__foot">
          <span className="zs-unlock__cipher">
            <Icon name="shield-check" size={13} /> AES-256 · zero-knowledge
          </span>
          <div className="zs-unlock__actions">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" disabled={!value} onClick={submit}>
              {isHidden ? "Show items" : "Unlock"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
