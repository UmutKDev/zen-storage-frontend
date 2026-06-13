import React from "react";

/** Avatar — image with initials fallback. Read-only at MVP (no upload). */
export function Avatar({ src, alt = "", initials = "", size = "default", className = "", ...rest }) {
  const sizeClass = size === "default" ? "" : ` zs-avatar--${size}`;
  return (
    <span className={`zs-avatar${sizeClass}${className ? " " + className : ""}`} {...rest}>
      {src ? <img src={src} alt={alt} /> : <span aria-hidden="true">{initials}</span>}
    </span>
  );
}
