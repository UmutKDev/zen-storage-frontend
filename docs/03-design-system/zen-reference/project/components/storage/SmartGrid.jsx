import React from "react";

/**
 * Justified "smart grid" layout for the storage browser's grid view.
 * Children (FileTile) advertise their aspect ratio via the --zs-ratio CSS
 * var; flex-grow proportional to that ratio justifies every row to the full
 * container width at a uniform row height. Pure CSS — reflows on resize with
 * no measurement code. The trailing spacer keeps the last row at natural size.
 */
export function SmartGrid({ rowHeight = 168, gap, children, style, ...rest }) {
  return (
    <div
      className="zs-smartgrid"
      style={{
        "--zs-row-h": rowHeight + "px",
        ...(gap != null ? { gap } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
      <span className="zs-smartgrid__spacer" aria-hidden="true"></span>
    </div>
  );
}
