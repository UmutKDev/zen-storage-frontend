import { create } from "zustand";

/**
 * The seam storage uses to trigger the secure-folder dialogs without importing
 * the secure logic. Storage (locked-row click, action menu) calls `open(...)`;
 * the single `<SecureFolderDialogs/>` controller (mounted by the storage
 * surface) reads `action` and renders the matching dialog. Transient + in-memory
 * — never persisted (these are open-flags, not secrets; the tokens live in
 * `secureFolders.store`).
 */
export type SecureActionKind =
  | "unlock"
  | "encrypt"
  | "decrypt"
  | "lock"
  | "reveal"
  | "hide"
  | "unhide"
  | "conceal";

export interface SecureAction {
  kind: SecureActionKind;
  /** The target folder path the action runs against. */
  path: string;
  /** Unlock dialog mode (`folder` encrypted vs `hidden`); defaults to folder. */
  mode?: "folder" | "hidden";
  /** On a successful unlock, navigate into this folder path (row-click flow). */
  navigateTo?: string;
}

interface SecureFolderUiState {
  action: SecureAction | null;
  open: (action: SecureAction) => void;
  close: () => void;
}

export const useSecureFolderUiStore = create<SecureFolderUiState>()((set) => ({
  action: null,
  open: (action) => set({ action }),
  close: () => set({ action: null }),
}));
