import React from "react";

/** Status/marker badge (pill). State variants tint at 15% with colored text. */
export function Badge({ variant = "secondary", className = "", children, ...rest }) {
  return (
    <span
      className={`zs-badge zs-badge--${variant}${className ? " " + className : ""}`}
      {...rest}
    >
      {children}
    </span>
  );
}
