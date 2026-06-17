import React from "react";

/** Toast notification row (glass-overlay, light touch). Static — host manages stacking/dismiss. */
export function Toast({ variant = "info", title, description, onClose }) {
  const paths = {
    success: <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>,
    error: <circle cx="12" cy="12" r="10"></circle>,
    info: <circle cx="12" cy="12" r="10"></circle>,
  };
  const marks = {
    success: <path d="m9 11 3 3L22 4"></path>,
    error: (
      <>
        <line x1="12" x2="12" y1="8" y2="12"></line>
        <line x1="12" x2="12.01" y1="16" y2="16"></line>
      </>
    ),
    info: (
      <>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </>
    ),
  };
  return (
    <div className={`zs-toast glass-overlay zs-toast--${variant}`} role="status">
      <span className="zs-toast__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {paths[variant]}
          {marks[variant]}
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="zs-toast__title">{title}</p>
        {description ? <p className="zs-toast__description">{description}</p> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          className="zs-btn zs-btn--ghost zs-btn--icon-xs"
          aria-label="Dismiss"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      ) : null}
    </div>
  );
}
