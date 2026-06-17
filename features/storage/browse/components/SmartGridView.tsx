"use client";

import { type CSSProperties, useMemo } from "react";
import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { ItemSelection } from "../../operations";
import type { FolderEntry } from "../lib/entries";
import { justifyRows } from "../lib/justify";
import { resolveTileMedia } from "../lib/tile";
import { useViewPrefs } from "../stores/viewPrefs.store";
import { useContainerWidth } from "../hooks/useContainerWidth";
import { TileCard } from "./TileCard";

/** Matches `.zs-smartgrid { gap }` so the JS wrap-points agree with the CSS. */
const GRID_GAP = 8;

interface Tile {
  entry: FolderEntry;
  url?: string;
  ratio: number;
}

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
}: {
  entries: FolderEntry[];
  path: string;
  selection: ItemSelection;
}) {
  const rowHeight = useViewPrefs((s) => s.gridRowH);
  const { ref, width } = useContainerWidth();

  const tiles = useMemo<Tile[]>(
    () => entries.map((entry) => ({ entry, ...resolveTileMedia(entry, rowHeight) })),
    [entries, rowHeight],
  );
  const rows = useMemo(
    () => justifyRows(tiles, { containerWidth: width, rowHeight, gap: GRID_GAP }),
    [tiles, width, rowHeight],
  );

  // `width === 0` pre-measure (or in jsdom, which has no layout) → `justifyRows`
  // returns a single row of all entries; the `.zs-smartgrid` flex-wrap lays them
  // out until the ResizeObserver reports a real width and the rows re-chunk.
  return (
    <div ref={ref} className="h-full">
      <VirtualList
        rows={rows}
        itemCount={entries.length}
        estimateSize={Math.round(rowHeight * 1.05 + GRID_GAP)}
        rowRole="none"
        renderRow={(row, index) => (
          <div
            className="zs-smartgrid pb-2"
            // nowrap on a measured row: rows are pre-packed to fit, so a sub-pixel
            // overflow (scrollbar) should shrink tiles, never wrap one onto a stray
            // line. Pre-measure (single row) we DO want flex-wrap.
            style={
              {
                "--zs-row-h": `${rowHeight}px`,
                ...(width > 0 ? { flexWrap: "nowrap" } : {}),
              } as CSSProperties
            }
          >
            {row.map((tile) => (
              <TileCard
                key={`${tile.entry.kind}:${tile.entry.key}`}
                entry={tile.entry}
                path={path}
                selection={selection}
                thumbnailUrl={tile.url}
                ratio={tile.ratio}
              />
            ))}
            {index === rows.length - 1 ? (
              <span className="zs-smartgrid__spacer" aria-hidden />
            ) : null}
          </div>
        )}
        getRowKey={(row, index) =>
          row[0] ? `${row[0].entry.kind}:${row[0].entry.key}` : index
        }
        ariaLabel={t("storage.list.label")}
        className="h-full"
      />
    </div>
  );
}
