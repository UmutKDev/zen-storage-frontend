"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Justified "smart grid" for media browsing. Children (FileTile) advertise
 * their aspect ratio via the `--zs-ratio` CSS var; flex-grow proportional to
 * that ratio justifies every row to the full container width at a uniform row
 * height. Pure CSS — reflows on resize with no measurement code. The trailing
 * spacer keeps the last row at its natural size.
 *
 * Reusable DS primitive: the media-grid view wires real thumbnails in its phase
 * (GridView still uses BrowseCard today).
 */
export function SmartGrid({
  rowHeight = 168,
  children,
  className,
  style,
}: {
  rowHeight?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("zs-smartgrid", className)}
      style={{ "--zs-row-h": `${rowHeight}px`, ...style } as CSSProperties}
    >
      {children}
      <span className="zs-smartgrid__spacer" aria-hidden />
    </div>
  );
}
