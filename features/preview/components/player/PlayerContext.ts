"use client";

import { createContext, useContext, type RefObject } from "react";
import type { CloudObjectModel } from "@/service/models";

/** A discovered embedded caption/subtitle track. */
export interface TextTrackInfo {
  index: number;
  label: string;
  lang: string;
}

/** A buffered time range on the media timeline. */
export interface BufferedRange {
  start: number;
  end: number;
}

/** A transient on-screen pill ("⏩ 5s", "1.5×", "Muted"). */
export interface HudContent {
  /** lucide icon name is resolved by CenterOverlay; we pass a key + label. */
  icon: "forward" | "back" | "volume" | "mute" | "speed" | "play" | "pause";
  label: string;
  /** Re-render key so the same gesture re-triggers the animation. */
  nonce: number;
}

export type PlayerError = "none" | "codec" | "recoverable";

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  /** May be `Infinity`/`NaN` for live streams — guard with `isScrubbable`. */
  duration: number;
  buffered: BufferedRange[];
  /** 0..1. */
  volume: number;
  muted: boolean;
  rate: number;
  loop: boolean;
  /** Network/decoder stall (distinct from an intentional seek while paused). */
  isBuffering: boolean;
  isSeeking: boolean;
  textTracks: TextTrackInfo[];
  /** Active caption track index, or `null` when captions are off. */
  activeTextTrack: number | null;
  ambientOn: boolean;
  pipSupported: boolean;
  pipActive: boolean;
  /** AirPlay (Safari WebKit) — true when the picker API exists (button shows). */
  airplaySupported: boolean;
  /** True while actively routing to an AirPlay target. */
  airplayActive: boolean;
  /** Cast (Remote Playback API — Chromium: Chrome/Edge/Brave). Button shows
   *  whenever supported; `prompt()` handles the no-device case. */
  castSupported: boolean;
  /** True while actively connected to a Cast device. */
  castActive: boolean;
  error: PlayerError;
  /** Intrinsic frame size once known (for the settings "Source W×H" line). */
  videoWidth: number;
  videoHeight: number;
}

export interface PlayerActions {
  toggle: () => void;
  play: () => void;
  pause: () => void;
  /** Absolute seek (clamped to a finite duration). */
  seekTo: (time: number) => void;
  /** Relative seek in seconds. */
  seekBy: (delta: number) => void;
  /** Seek to a percent (0..100) of a finite duration. */
  seekToPercent: (percent: number) => void;
  /** Absolute volume (0..1); unmutes. */
  setVolume: (volume: number) => void;
  /** Relative volume change; unmutes. */
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  /** Step to the next/previous rate preset. */
  bumpRate: (dir: 1 | -1) => void;
  toggleLoop: () => void;
  /** Step one frame (paused only). */
  stepFrame: (dir: 1 | -1) => void;
  /** Set the active caption track (`null` = off). */
  setTextTrack: (index: number | null) => void;
  /** Cycle Off → track 0 → track 1 → … → Off. */
  cycleCaptions: () => void;
  toggleAmbient: () => void;
  togglePip: () => void;
  /** Open the AirPlay device picker (Safari only). */
  showAirplay: () => void;
  /** Open the Cast / remote-playback device picker (Chrome). */
  showCast: () => void;
  /** Re-fetch a fresh signed URL + retry, restoring the play position. */
  reload: () => void;
}

export interface FullscreenApi {
  active: boolean;
  supported: boolean;
  toggle: () => void;
}

export interface ControlsApi {
  visible: boolean;
  show: () => void;
}

export interface PlayerContextValue {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  object: CloudObjectModel;
  state: PlayerState;
  actions: PlayerActions;
  fullscreen: FullscreenApi;
  controls: ControlsApi;
  hud: HudContent | null;
  flashHud: (icon: HudContent["icon"], label: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerContextProvider = PlayerContext.Provider;

/** Read the player context. Throws if used outside `<VideoPlayer>`. */
export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayerContext must be used within <VideoPlayer>");
  }
  return ctx;
}
