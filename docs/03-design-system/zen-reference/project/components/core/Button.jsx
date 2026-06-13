import React from "react";

/**
 * Zen Storage button. Variants/sizes mirror components/ui/button.tsx in the
 * production repo (shadcn new-york wrapped). Primary = the ONE orange action
 * per view; destructive actions use the destructive variants, never primary.
 */
export function Button({
  variant = "primary",
  size = "default",
  className = "",
  children,
  ...rest
}) {
  const sizeClass = size === "default" ? "" : ` zs-btn--${size}`;
  return (
    <button
      type="button"
      className={`zs-btn zs-btn--${variant}${sizeClass}${className ? " " + className : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
