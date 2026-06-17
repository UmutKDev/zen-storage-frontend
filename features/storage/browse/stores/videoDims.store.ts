import { create } from "zustand";

/**
 * Intrinsic dimensions of video files, keyed by object key, discovered
 * client-side from a `<video>` element's `videoWidth/videoHeight` on
 * `loadedmetadata` (the backend stores no video dimensions, only image ones).
 *
 * The smart grid reads this to justify a video tile to its real aspect ratio
 * instead of the 16:9 guess — so a freshly measured video re-packs its row once,
 * then stays stable. In-memory only (no persistence): cheap to re-measure each
 * session and survives virtualization mount/unmount within the session.
 */
interface VideoDimsState {
  dims: Record<string, { w: number; h: number }>;
  setDims: (key: string, w: number, h: number) => void;
}

export const useVideoDims = create<VideoDimsState>((set) => ({
  dims: {},
  setDims: (key, w, h) =>
    set((state) => {
      // Ignore a degenerate read; bail on an unchanged value so a remount's
      // repeated `loadedmetadata` doesn't trigger a needless re-render.
      if (!w || !h) return state;
      const prev = state.dims[key];
      if (prev && prev.w === w && prev.h === h) return state;
      return { dims: { ...state.dims, [key]: { w, h } } };
    }),
}));
