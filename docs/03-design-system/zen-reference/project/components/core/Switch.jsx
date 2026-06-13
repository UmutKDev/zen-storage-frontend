import React from "react";

/** Toggle switch (controlled or uncontrolled). */
export function Switch({ checked, defaultChecked = false, onCheckedChange, disabled, ...rest }) {
  const [internal, setInternal] = React.useState(defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!isOn);
    if (onCheckedChange) onCheckedChange(!isOn);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      className="zs-switch"
      disabled={disabled}
      onClick={toggle}
      {...rest}
    >
      <span className="zs-switch__thumb"></span>
    </button>
  );
}
