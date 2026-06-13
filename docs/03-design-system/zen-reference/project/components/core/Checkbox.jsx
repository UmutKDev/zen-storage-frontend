import React from "react";

/** Checkbox with built-in ≥40px hit target. Reveals on hover inside FileRow/FileCard. */
export function Checkbox({ checked, defaultChecked = false, onCheckedChange, disabled, className = "", ...rest }) {
  const [internal, setInternal] = React.useState(defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (checked === undefined) setInternal(!isOn);
    if (onCheckedChange) onCheckedChange(!isOn);
  };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isOn}
      className={`zs-checkbox${className ? " " + className : ""}`}
      disabled={disabled}
      onClick={toggle}
      {...rest}
    >
      {isOn ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : null}
    </button>
  );
}
