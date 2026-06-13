import React from "react";
import { Icon } from "../core/Icon.jsx";

/**
 * Anchored dropdown menu (overlay tier — glass). Render inside a
 * `position: relative` wrapper that also holds the trigger; the panel drops
 * below the trigger, aligned via `align`. Closes on Escape and on any
 * pointer-down outside the wrapper — so the trigger's own onClick can
 * simply toggle `open`. Arrow keys move focus between items.
 */
export function Menu({ open, onClose, items = [], align = "start", width }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const root = ref.current ? ref.current.parentElement : null;
      if (root && !root.contains(e.target) && onClose) onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const els = ref.current
        ? Array.from(ref.current.querySelectorAll(".zs-menu__item:not(:disabled)"))
        : [];
      if (!els.length) return;
      const i = els.indexOf(document.activeElement);
      const next =
        e.key === "ArrowDown" ? (i + 1) % els.length : i <= 0 ? els.length - 1 : i - 1;
      els[next].focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      className={`zs-menu glass-overlay${align === "end" ? " zs-menu--end" : ""}`}
      style={width ? { width, minWidth: width } : undefined}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} className="zs-menu__sep" role="separator"></div>
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className={`zs-menu__item${item.danger ? " zs-menu__item--danger" : ""}`}
            disabled={item.disabled}
            onClick={() => {
              if (onClose) onClose();
              if (item.onSelect) item.onSelect();
            }}
          >
            {item.icon ? (
              <span className="zs-menu__icon" aria-hidden="true">
                {typeof item.icon === "string" ? <Icon name={item.icon} size={15} /> : item.icon}
              </span>
            ) : null}
            <span className="zs-menu__text">
              <span className="zs-menu__label">{item.label}</span>
              {item.description ? <span className="zs-menu__desc">{item.description}</span> : null}
            </span>
            {item.kbd ? <kbd className="zs-menu__kbd">{item.kbd}</kbd> : null}
          </button>
        )
      )}
    </div>
  );
}
