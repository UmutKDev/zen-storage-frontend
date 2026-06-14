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
  setView: (view: ViewMode) => void;
  setSort: (key: SortKey, dir: SortDir) => void;
  setFilter: (type: FilterType, ext: string) => void;
}

export const useViewPrefs = create<ViewPrefsState>()(
  persist(
    (set) => ({
      view: "list",
      sortKey: "name",
      sortDir: "asc",
      filterType: "all",
      filterExt: "",
      setView: (view) => set({ view }),
      setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
      setFilter: (filterType, filterExt) => set({ filterType, filterExt }),
    }),
    {
      name: "storage-view",
      version: 2,
      // v1 → v2 added the type/extension filter. The persisted v1 shape (view +
      // sort) is forward-compatible, so carry it through and let the new fields
      // take their defaults via the shallow merge. (Without a `migrate`, zustand
      // logs "couldn't be migrated" and discards the stored prefs.)
      migrate: (persisted) => persisted as ViewPrefsState,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.sessionStorage,
      ),
    },
  ),
);
