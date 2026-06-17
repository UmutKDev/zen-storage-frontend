import { create } from "zustand";

/**
 * The ordered list of previewable file keys in the current browse/search view.
 * `StorageBrowser` publishes it; the preview modal's arrow-key navigation
 * (features/preview) reads it. A neutral hand-off channel so the preview feature
 * never imports browse internals — storage writes, preview reads (one-way;
 * storage never imports preview, which keeps the two features acyclic).
 *
 * In-memory + transient: it holds only the currently-visible window, so a cold
 * deep-link (no browser mounted) finds it empty → arrow-nav is simply disabled.
 */
interface PreviewNavState {
  keys: string[];
  setKeys: (keys: string[]) => void;
}

export const usePreviewNavStore = create<PreviewNavState>()((set) => ({
  keys: [],
  setKeys: (keys) => set({ keys }),
}));
