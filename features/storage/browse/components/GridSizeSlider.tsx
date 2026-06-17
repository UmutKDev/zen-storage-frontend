"use client";

import { ImageIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  GRID_ROW_MAX,
  GRID_ROW_MIN,
  useViewPrefs,
} from "../stores/viewPrefs.store";

/** Smart-grid "tile size" control — scales the justified row height. Shown in the
 *  toolbar only in grid view; the value persists in `viewPrefs`. */
export function GridSizeSlider() {
  const gridRowH = useViewPrefs((s) => s.gridRowH);
  const setGridRowH = useViewPrefs((s) => s.setGridRowH);

  return (
    <label
      className="hidden h-9 items-center gap-1.5 rounded-md border border-border px-2 text-muted-foreground sm:flex"
      title={t("storage.view.tileSize")}
    >
      <ImageIcon className="size-3 shrink-0" aria-hidden />
      <input
        type="range"
        min={GRID_ROW_MIN}
        max={GRID_ROW_MAX}
        step={4}
        value={gridRowH}
        onChange={(e) => setGridRowH(Number(e.target.value))}
        aria-label={t("storage.view.tileSize")}
        className="h-1 w-20 cursor-pointer [accent-color:var(--brand)]"
      />
      <ImageIcon className="size-4 shrink-0" aria-hidden />
    </label>
  );
}
