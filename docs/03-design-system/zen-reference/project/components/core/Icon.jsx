import React from "react";

/**
 * Lucide icon, rendered from the Lucide UMD global. Load Lucide once per page:
 * <script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
 * Names are kebab-case lucide names ("folder", "eye-off", "trash-2").
 */
export function Icon({ name, size = 16, strokeWidth = 2, style, className, ...rest }) {
  const lucide = typeof window !== "undefined" ? window.lucide : null;
  const pascal = String(name)
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const node = lucide && lucide.icons ? lucide.icons[pascal] : null;
  // Lucide IconNode: either [tag, attrs, children][] or [tag, attrs][]
  const children = node
    ? (Array.isArray(node[0]) ? node : node[2] || []).map((child, i) => {
        const [tag, attrs] = child;
        return React.createElement(tag, { ...attrs, key: i });
      })
    : null;
  if (!children) {
    if (!lucide) console.warn("Icon: lucide UMD not loaded; include the CDN script.");
    else console.warn(`Icon: unknown lucide icon "${name}"`);
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </svg>
  );
}
