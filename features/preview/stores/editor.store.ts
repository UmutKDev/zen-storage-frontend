import { create } from "zustand";

/**
 * Modal↔editor unsaved-changes hand-off. The `DocumentEditor` registers a guard
 * (its `dirty` flag + `save`/`discard` actions) while mounted; the preview
 * modal's `close()` reads it to show a Save / Discard / Cancel prompt before
 * navigating away. Cleared on editor unmount. In-memory + transient — the same
 * write-here/read-there idiom as `previewNav` / `storageUi`.
 */
export interface EditorGuard {
  dirty: boolean;
  /** Commit the document; resolves `true` when it's safe to leave. */
  save: () => Promise<boolean>;
  /** Drop the server draft; then it's safe to leave. */
  discard: () => Promise<void>;
}

interface EditorState {
  guard: EditorGuard | null;
  setGuard: (guard: EditorGuard | null) => void;
  /**
   * Bumped to ask the open editor to reload its content in place — used after a
   * version **restore** (from the footer panel) replaces the current content.
   * The editor watches this and re-seeds CodeMirror without remounting, so the
   * edit lock is kept.
   */
  reloadNonce: number;
  requestReload: () => void;
  /**
   * Whether the open editor currently holds the edit lock. The versions panel
   * reads it to gate restore/delete (a doc locked by another user / a lost lock
   * is read-only — actions are hidden, but the diff stays viewable). Published
   * by the editor; defaults `false` until the lock is acquired.
   */
  canEdit: boolean;
  setCanEdit: (canEdit: boolean) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  guard: null,
  setGuard: (guard) => set({ guard }),
  reloadNonce: 0,
  requestReload: () => set((s) => ({ reloadNonce: s.reloadNonce + 1 })),
  canEdit: false,
  setCanEdit: (canEdit) => set({ canEdit }),
}));
