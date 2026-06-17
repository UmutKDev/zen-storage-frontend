"use client";

import { type CSSProperties, useMemo } from "react";
import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { ItemSelection } from "../../operations";
import type { FolderEntry } from "../lib/entries";
import type { PendingEntry } from "../lib/pending";
import { justifyRows, justifiedRowHeight } from "../lib/justify";
import { resolveTileMedia } from "../lib/tile";
import { useViewPrefs } from "../stores/viewPrefs.store";
import { useVideoDims } from "../stores/videoDims.store";
import { useContainerWidth } from "../hooks/useContainerWidth";
import { TileCard } from "./TileCard";
import { PendingTile } from "./PendingTile";

/** Matches `.zs-smartgrid { gap }` so the JS wrap-points agree with the CSS. */
const GRID_GAP = 8;
/** Cap how tall the left-aligned last row may grow to match the row above it
 *  (a sparse last row's own justified height can be huge — don't follow it). */
const MAX_LAST_ROW_H_FACTOR = 2;

/** A grid tile is either an in-flight pending placeholder (square) or a real
 *  entry tile (image thumbnail or icon). Both carry a `ratio` for justification. */
type Tile =
  | { pending: PendingEntry; ratio: number }
  | { entry: FolderEntry; url?: string; ratio: number };

/**
 * The zen **smart grid**: a Yandex-style justified grid of {@link TileCard}s —
 * image thumbnails keep their aspect ratio, folders/docs/video are square icon
 * tiles. Rows are pre-packed ({@link justifyRows}) so the grid **virtualizes** by
 * row (the >100-entry rule); each row renders as one `.zs-smartgrid` whose
 * flex-grow visually justifies it (the last row stays natural via the spacer).
 * Row height is a user preference (`viewPrefs.gridRowH`).
 */
export function SmartGridView({
  entries,
  path,
  selection,
  pending = [],
}: {
  entries: FolderEntry[];
  path: string;
  selection: ItemSelection;
  /** In-flight operations shown as non-interactive square tiles before the real ones. */
  pending?: PendingEntry[];
}) {
  const rowHeight = useViewPrefs((s) => s.gridRowH);
  const { ref, width } = useContainerWidth();
  // Client-measured video frame sizes — a freshly measured video re-justifies
  // its row to the real aspect ratio (FileTile reports them on loadedmetadata).
  const videoDims = useVideoDims((s) => s.dims);

  const tiles = useMemo<Tile[]>(
    () => [
      ...pending.map((p) => ({ pending: p, ratio: 1 })),
      ...entries.map((entry) => ({
        entry,
        ...resolveTileMedia(entry, rowHeight, videoDims),
      })),
    ],
    [pending, entries, rowHeight, videoDims],
  );
  const rows = useMemo(
    () =>
      justifyRows(tiles, { containerWidth: width, rowHeight, gap: GRID_GAP }),
    [tiles, width, rowHeight],
  );

  // `width === 0` pre-measure (or in jsdom, which has no layout) → `justifyRows`
  // returns a single row of all entries; the `.zs-smartgrid` flex-wrap lays them
  // out until the ResizeObserver reports a real width and the rows re-chunk.
  return (
    <div ref={ref} className="h-full">
      <VirtualList
        rows={rows}
        itemCount={entries.length + pending.length}
        estimateSize={Math.round(rowHeight * 1.05 + GRID_GAP)}
        rowRole="none"
        renderRow={(row, index) => {
          const isLast = index === rows.length - 1;
          // The last row is left-aligned and does NOT flex-grow (the spacer eats
          // the slack), so it would sit at the base height while the full rows
          // above justified taller. Size it to match the row above instead.
          const rowH =
            isLast && rows.length > 1 && width > 0
              ? Math.min(
                  rowHeight * MAX_LAST_ROW_H_FACTOR,
                  Math.max(
                    rowHeight,
                    justifiedRowHeight(rows[index - 1], {
                      containerWidth: width,
                      gap: GRID_GAP,
                      fallback: rowHeight,
                    }),
                  ),
                )
              : rowHeight;
          return (
            <div
              className="zs-smartgrid pb-2"
              // nowrap on a measured row: rows are pre-packed to fit, so a sub-pixel
              // overflow (scrollbar) should shrink tiles, never wrap one onto a stray
              // line. Pre-measure (single row) we DO want flex-wrap.
              style={
                {
                  "--zs-row-h": `${rowH}px`,
                  ...(width > 0 ? { flexWrap: "nowrap" } : {}),
                } as CSSProperties
              }
            >
              {row.map((tile) =>
                "pending" in tile ? (
                  <PendingTile
                    key={`pending:${tile.pending.id}`}
                    entry={tile.pending}
                  />
                ) : (
                  <TileCard
                    key={`${tile.entry.kind}:${tile.entry.key}`}
                    entry={tile.entry}
                    path={path}
                    selection={selection}
                    thumbnailUrl={tile.url}
                    ratio={tile.ratio}
                  />
                ),
              )}
              {index === rows.length - 1 ? (
                <span className="zs-smartgrid__spacer" aria-hidden />
              ) : null}
            </div>
          );
        }}
        getRowKey={(row, index) =>
          row[0]
            ? "pending" in row[0]
              ? `pending:${row[0].pending.id}`
              : `${row[0].entry.kind}:${row[0].entry.key}`
            : index
        }
        ariaLabel={t("storage.list.label")}
        className="h-full"
      />
    </div>
  );
}
