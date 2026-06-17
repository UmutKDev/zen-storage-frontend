import { create } from "zustand";

/**
 * Multi-select state for the storage browser (feature-local, **in-memory
 * only** — selection never persists). Holds keys + the shift-range anchor;
 * ordering/range math lives in `useItemSelection`, which is also what clears
 * the selection on folder change. The Stage D command palette reads
 * `selectedKeys` from here (phase-3 contract).
 */
interface SelectionState {
  selectedKeys: ReadonlySet<string>;
  anchorKey: string | null;
  /** Plain click: selection becomes just this key; anchor moves to it. */
  replaceWith: (key: string) => void;
  /** Ctrl/Cmd click or checkbox: flip this key; anchor moves to it. */
  toggle: (key: string) => void;
  /** Shift click: selection becomes the given range; anchor unchanged. */
  setRange: (keys: ReadonlyArray<string>) => void;
  /** Select-all over the current folder's selectable keys; anchor unchanged. */
  setAll: (keys: ReadonlyArray<string>) => void;
  /**
   * Drop the given keys from the selection (e.g. after they're deleted) — a
   * partial prune that leaves the rest selected. No-op when nothing matches.
   * Clears the anchor only if it was among the removed keys.
   */
  deselect: (keys: ReadonlyArray<string>) => void;
  clear: () => void;
}

const EMPTY: ReadonlySet<string> = new Set();

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedKeys: EMPTY,
  anchorKey: null,
  replaceWith: (key) => set({ selectedKeys: new Set([key]), anchorKey: key }),
  toggle: (key) =>
    set((state) => {
      const next = new Set(state.selectedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { selectedKeys: next, anchorKey: key };
    }),
  setRange: (keys) => set({ selectedKeys: new Set(keys) }),
  setAll: (keys) => set({ selectedKeys: new Set(keys) }),
  deselect: (keys) =>
    set((state) => {
      if (state.selectedKeys.size === 0) return state;
      const next = new Set(state.selectedKeys);
      let changed = false;
      let anchorRemoved = false;
      for (const key of keys) {
        if (next.delete(key)) {
          changed = true;
          if (key === state.anchorKey) anchorRemoved = true;
        }
      }
      if (!changed) return state;
      return {
        selectedKeys: next.size === 0 ? EMPTY : next,
        anchorKey: anchorRemoved ? null : state.anchorKey,
      };
    }),
  clear: () => set({ selectedKeys: EMPTY, anchorKey: null }),
}));
