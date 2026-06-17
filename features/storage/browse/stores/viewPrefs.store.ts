import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** No-op storage for SSR (sessionStorage is undefined on the server). */
const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * Browse view preferences (feature-local). View mode + sort, persisted to
 * **sessionStorage** (a per-session UI preference, not durable). SSR-safe: the
 * storage factory returns undefined on the server.
 */
export type ViewMode = "list" | "grid";
export type SortKey = "name" | "size" | "modified" | "type";
export type SortDir = "asc" | "desc";

/** Smart-grid tile (row) height bounds, in px — the "tile size" slider range. */
export const GRID_ROW_MIN = 132;
export const GRID_ROW_MAX = 300;
export const GRID_ROW_DEFAULT = 168;
/** Coarse type filter over the loaded folder window (client-side). `all` is the
 *  no-op default; the file categories mirror `extensionCategory` (lib/utils). */
export type FilterType =
  | "all"
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "text"
  | "archive";

interface ViewPrefsState {
  view: ViewMode;
  sortKey: SortKey;
  sortDir: SortDir;
  filterType: FilterType;
  /** Extension narrowing (lowercased, no dot); "" = no extension filter. */
  filterExt: string;
  /** Smart-grid tile/row height in px (clamped to [GRID_ROW_MIN, GRID_ROW_MAX]). */
  gridRowH: number;
  setView: (view: ViewMode) => void;
  setSort: (key: SortKey, dir: SortDir) => void;
  setFilter: (type: FilterType, ext: string) => void;
  setGridRowH: (h: number) => void;
}

export const useViewPrefs = create<ViewPrefsState>()(
  persist(
    (set) => ({
      view: "list",
      sortKey: "name",
      sortDir: "asc",
      filterType: "all",
      filterExt: "",
      gridRowH: GRID_ROW_DEFAULT,
      setView: (view) => set({ view }),
      setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
      setFilter: (filterType, filterExt) => set({ filterType, filterExt }),
      setGridRowH: (h) =>
        set({ gridRowH: Math.min(GRID_ROW_MAX, Math.max(GRID_ROW_MIN, Math.round(h))) }),
    }),
    {
      name: "storage-view",
      version: 3,
      // Each version added forward-compatible fields (v2: type/extension filter;
      // v3: gridRowH). The persisted older shape is carried through and the new
      // fields take their defaults via the shallow merge. (Without a `migrate`,
      // zustand logs "couldn't be migrated" and discards the stored prefs.)
      migrate: (persisted) => persisted as ViewPrefsState,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.sessionStorage,
      ),
    },
  ),
);
