import { create } from "zustand";
import type { FolderEntry } from "../../browse/lib/entries";

/**
 * Storage-surface dialog triggers (feature-local, in-memory). Lifts the
 * open/close intent for the bulk + create dialogs out of component-local state
 * so the ⌘K command palette can fire them too — the dialogs themselves stay
 * mounted in the storage surface (`BulkActionBar`/`CreateMenu`), which owns the
 * selection + path needed to actually run the operation. `sheetEntry` drives the
 * touch long-press bottom sheet (`EntryActionsSheet`). Reset is unnecessary: the
 * values are transient open flags, never persisted.
 */
export type BulkDialogKind = "move" | "delete";
export type CreateDialogKind = "folder" | "file";

interface StorageUiState {
  bulkDialog: BulkDialogKind | null;
  createDialog: CreateDialogKind | null;
  /** The entry whose touch action sheet is open (null = closed). */
  sheetEntry: FolderEntry | null;
  /** Whether the duplicate-scan dialog is open. */
  scanDialog: boolean;
  openBulkDialog: (kind: BulkDialogKind) => void;
  closeBulkDialog: () => void;
  openCreateDialog: (kind: CreateDialogKind) => void;
  closeCreateDialog: () => void;
  openSheet: (entry: FolderEntry) => void;
  closeSheet: () => void;
  openScanDialog: () => void;
  closeScanDialog: () => void;
}

export const useStorageUiStore = create<StorageUiState>()((set) => ({
  bulkDialog: null,
  createDialog: null,
  sheetEntry: null,
  scanDialog: false,
  openBulkDialog: (bulkDialog) => set({ bulkDialog }),
  closeBulkDialog: () => set({ bulkDialog: null }),
  openCreateDialog: (createDialog) => set({ createDialog }),
  closeCreateDialog: () => set({ createDialog: null }),
  openSheet: (sheetEntry) => set({ sheetEntry }),
  closeSheet: () => set({ sheetEntry: null }),
  openScanDialog: () => set({ scanDialog: true }),
  closeScanDialog: () => set({ scanDialog: false }),
}));
