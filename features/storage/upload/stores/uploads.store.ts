import { create } from "zustand";

/**
 * Tray/queue UI state (feature-local, **in-memory** — the resumability source
 * of truth is IndexedDB via `storage/queue.ts`, never zustand persist). The
 * engine writes here; components only read + dispatch engine commands.
 *
 * Status flow (upload-pipeline §7): queued → presigning (Create session) →
 * uploading (n%) → completing → done · error (retry) · paused (resume) ·
 * canceled. Queue-specific additions: `conflict` (waiting on the user's
 * strategy) and `blocked` (quota crossed mid-batch — remaining files halt).
 */
export type UploadStatus =
  | "queued"
  | "presigning"
  | "uploading"
  | "completing"
  | "done"
  | "error"
  | "paused"
  | "canceled"
  | "conflict"
  | "blocked";

export interface UploadItem {
  id: string;
  /** One user action (drop / picker confirm) = one batch (conflict radius). */
  batchId: string;
  fileName: string;
  /** Destination folder ("" = root). */
  path: string;
  /** Top-level picked folder this file belongs to — folder uploads collapse to
   *  ONE queue row keyed by `(batchId, folderName)`. Undefined for loose files.
   *  Runtime-only (not persisted): refresh-resumed items fall back to per-file
   *  rows, which is acceptable since each resumes as its own batch. */
  folderName?: string;
  totalSize: number;
  uploadedBytes: number;
  status: UploadStatus;
  /** Resolved, human-readable copy for error/blocked rows. */
  errorMessage?: string;
}

interface UploadsState {
  items: ReadonlyArray<UploadItem>;
  upsert: (item: UploadItem) => void;
  patch: (id: string, patch: Partial<UploadItem>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useUploadsStore = create<UploadsState>()((set) => ({
  items: [],
  upsert: (item) =>
    set((state) => {
      const index = state.items.findIndex((i) => i.id === item.id);
      if (index === -1) return { items: [...state.items, item] };
      const items = [...state.items];
      items[index] = item;
      return { items };
    }),
  patch: (id, patch) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
  remove: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}));
