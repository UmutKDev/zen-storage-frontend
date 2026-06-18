import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** No-op storage for SSR (sessionStorage is undefined on the server). */
const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * Video-player preferences (feature-local). Volume / mute / speed / ambient /
 * captions, persisted to **sessionStorage** so the choices survive file→file
 * navigation and a refresh within the tab (per-file resume position is out of
 * scope by design). Mirrors `features/storage/browse/stores/viewPrefs.store.ts`
 * exactly: SSR-safe storage factory + an explicit `migrate` passthrough (without
 * it zustand discards stored prefs on a version bump). The ESLint
 * `localStorage.setItem` ban is satisfied — writes go through this reviewed store.
 */
interface VideoPrefsState {
  /** 0..1. */
  volume: number;
  muted: boolean;
  /** Playback rate multiplier (1 = normal). */
  playbackRate: number;
  /** Ambient glow on/off. */
  ambientOn: boolean;
  /** Whether the user prefers captions on (auto-enables the first track). */
  captionsPref: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (playbackRate: number) => void;
  setAmbientOn: (ambientOn: boolean) => void;
  setCaptionsPref: (captionsPref: boolean) => void;
}

export const useVideoPrefs = create<VideoPrefsState>()(
  persist(
    (set) => ({
      volume: 1,
      muted: false,
      playbackRate: 1,
      ambientOn: true,
      captionsPref: false,
      setVolume: (volume) => set({ volume }),
      setMuted: (muted) => set({ muted }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setAmbientOn: (ambientOn) => set({ ambientOn }),
      setCaptionsPref: (captionsPref) => set({ captionsPref }),
    }),
    {
      name: "video-player",
      version: 1,
      migrate: (persisted) => persisted as VideoPrefsState,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.sessionStorage,
      ),
    },
  ),
);
