import React from "react";

/** Modal dialog on the glass-overlay tier. Controlled via `open`. */
export function Dialog({ open, onClose, title, description, children, footer, maxWidth = 480 }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="zs-dialog glass-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={maxWidth !== 480 ? { maxWidth } : undefined}
      >
        {title ? <h2 className="zs-dialog__title">{title}</h2> : null}
        {description ? <p className="zs-dialog__description">{description}</p> : null}
        {children}
        {footer ? <div className="zs-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
