import React from "react";

/**
 * The signature glass surface. Two tiers ONLY:
 * "chrome" (topbar/sidebar, 12px blur) and "overlay" (modals/popovers/palette, 16px blur).
 * Includes the 1px top highlight rim + prefers-reduced-transparency solid fallback (CSS).
 * Never nest glass; never put glass on content/cards/data.
 */
export function GlassPanel({ tier = "chrome", as = "div", className = "", style, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={`glass-${tier}${className ? " " + className : ""}`} style={style} {...rest}>
      {children}
    </Tag>
  );
}
