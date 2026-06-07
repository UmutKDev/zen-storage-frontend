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

interface ViewPrefsState {
  view: ViewMode;
  sortKey: SortKey;
  sortDir: SortDir;
  setView: (view: ViewMode) => void;
  setSort: (key: SortKey, dir: SortDir) => void;
}

export const useViewPrefs = create<ViewPrefsState>()(
  persist(
    (set) => ({
      view: "list",
      sortKey: "name",
      sortDir: "asc",
      setView: (view) => set({ view }),
      setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
    }),
    {
      name: "storage-view",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.sessionStorage,
      ),
    },
  ),
);
