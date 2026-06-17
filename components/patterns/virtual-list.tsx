"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils/index";

/**
 * Lists with more than this many entries are virtualized; below it they render
 * directly (the overhead isn't worth it). Locked constant — not a per-call prop.
 * See phase-3 §"Large-list performance".
 */
export const VIRTUALIZE_THRESHOLD = 100;

export function shouldVirtualize(count: number): boolean {
  return count >= VIRTUALIZE_THRESHOLD;
}

/**
 * Generic scroll container that virtualizes its rows past the threshold. The
 * "row" is the unit of layout: the list view passes one entry per row; the grid
 * view passes a chunk of cards per row. `onEndReached` fires (in both modes) via
 * a bottom sentinel — wire it to `fetchNextPage` for infinite loading.
 */
export function VirtualList<R>({
  rows,
  itemCount,
  estimateSize,
  overscan = 10,
  renderRow,
  getRowKey,
  onEndReached,
  className,
  ariaLabel,
  rowRole = "listitem",
}: {
  rows: ReadonlyArray<R>;
  /** Entry count that drives the virtualize threshold (defaults to rows.length). */
  itemCount?: number;
  estimateSize: number;
  overscan?: number;
  renderRow: (row: R, index: number) => ReactNode;
  getRowKey: (row: R, index: number) => string | number;
  onEndReached?: () => void;
  className?: string;
  ariaLabel?: string;
  /**
   * Role for each row wrapper. `"listitem"` (default) for one-entry-per-row
   * lists; `"none"` for the grid, where the row holds several cards that each
   * carry their own `listitem` role (so the row itself is transparent).
   */
  rowRole?: "listitem" | "none";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const virtualize = shouldVirtualize(itemCount ?? rows.length);

  // TanStack Virtual returns non-memoizable functions, so React Compiler skips
  // memoizing this component — fine for a virtualized list (it re-renders on
  // scroll anyway).
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Infinite load: observe a bottom sentinel inside the scroll container. Works
  // in both direct and virtualized modes (the sentinel sits after the content).
  useEffect(() => {
    if (!onEndReached) return;
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onEndReached();
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onEndReached]);

  return (
    <div
      ref={scrollRef}
      role="list"
      aria-label={ariaLabel}
      className={cn("relative overflow-auto", className)}
    >
      {virtualize ? (
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((item) => (
            <div
              key={getRowKey(rows[item.index], item.index)}
              // Measure each row's real height (rows vary — duplicate groups have
              // different file counts, cards differ) so absolutely-positioned rows
              // never overlap or leave gaps. `estimateSize` is only the first guess.
              ref={virtualizer.measureElement}
              role={rowRole}
              data-index={item.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${item.start}px)`,
              }}
            >
              {renderRow(rows[item.index], item.index)}
            </div>
          ))}
        </div>
      ) : (
        rows.map((row, index) => (
          <div role={rowRole} key={getRowKey(row, index)}>
            {renderRow(row, index)}
          </div>
        ))
      )}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
    </div>
  );
}
