"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useVideoPrefs } from "../stores/videoPrefs.store";
import {
  clamp,
  isScrubbable,
  RATES,
  STEP_FPS,
} from "../components/player/format";
import type {
  BufferedRange,
  PlayerActions,
  PlayerError,
  PlayerState,
  TextTrackInfo,
} from "../components/player/PlayerContext";

/** A `<video>` augmented with the non-standard PiP/HLS bits we feature-detect. */
type VideoEl = HTMLVideoElement;

/** Safari WebKit AirPlay (playback-target) surface — not in the DOM lib. */
interface AirplayVideo extends HTMLVideoElement {
  webkitShowPlaybackTargetPicker?: () => void;
  webkitCurrentPlaybackTargetIsWireless?: boolean;
}

const INITIAL: PlayerState = {
  playing: false,
  currentTime: 0,
  duration: NaN,
  buffered: [],
  volume: 1,
  muted: false,
  rate: 1,
  loop: false,
  isBuffering: false,
  isSeeking: false,
  textTracks: [],
  activeTextTrack: null,
  ambientOn: true,
  pipSupported: false,
  pipActive: false,
  airplaySupported: false,
  airplayActive: false,
  castSupported: false,
  castActive: false,
  error: "none",
  videoWidth: 0,
  videoHeight: 0,
};

function readBuffered(v: VideoEl): BufferedRange[] {
  const out: BufferedRange[] = [];
  const b = v.buffered;
  for (let i = 0; i < b.length; i++) {
    out.push({ start: b.start(i), end: b.end(i) });
  }
  return out;
}

function readTracks(v: VideoEl): TextTrackInfo[] {
  const out: TextTrackInfo[] = [];
  const tt = v.textTracks;
  for (let i = 0; i < tt.length; i++) {
    const t = tt[i];
    if (t.kind === "subtitles" || t.kind === "captions") {
      out.push({
        index: i,
        label: t.label || t.language || `Track ${out.length + 1}`,
        lang: t.language || "",
      });
    }
  }
  return out;
}

function activeTrackIndex(v: VideoEl): number | null {
  const tt = v.textTracks;
  for (let i = 0; i < tt.length; i++) {
    if (tt[i].mode === "showing") return i;
  }
  return null;
}

function classifyError(v: VideoEl): PlayerError {
  const code = v.error?.code;
  if (
    code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
    code === MediaError.MEDIA_ERR_DECODE
  ) {
    return "codec";
  }
  return "recoverable";
}

function pipSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    document.pictureInPictureEnabled === true &&
    "requestPictureInPicture" in HTMLVideoElement.prototype
  );
}

/**
 * The player engine: binds to the `<video>` element via its media events and
 * mirrors them into React state, and exposes **element-driven** actions (they
 * read live from the element, so the keyboard handler never closes over stale
 * state). Persisted prefs (volume/mute/rate/captions) are re-applied on every
 * `loadedmetadata` — the element remounts per file, so the fresh element needs
 * them pushed back on. A first-frame poster seek paints a real frame under
 * `preload="metadata"` (the same trick the grid uses for video tiles).
 */
export function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement | null>,
  { onReload }: { onReload?: () => void },
): { state: PlayerState; actions: PlayerActions } {
  const [state, setState] = useState<PlayerState>(() => ({
    ...INITIAL,
    volume: useVideoPrefs.getState().volume,
    muted: useVideoPrefs.getState().muted,
    rate: useVideoPrefs.getState().playbackRate,
    ambientOn: useVideoPrefs.getState().ambientOn,
    pipSupported: pipSupported(),
  }));

  const patch = useCallback(
    (p: Partial<PlayerState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  /** Position to restore after a reload (signed-URL retry). */
  const resumeAtRef = useRef<number | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const applyPrefs = () => {
      const p = useVideoPrefs.getState();
      v.volume = p.volume;
      v.muted = p.muted;
      v.playbackRate = p.playbackRate;
    };

    const onLoadedMeta = () => {
      applyPrefs();
      // Restore a pre-reload position, else paint a poster frame past 0 so the
      // stage isn't black under preload="metadata". try/catch: live streams throw.
      const resume = resumeAtRef.current;
      if (resume != null) {
        resumeAtRef.current = null;
        try {
          v.currentTime = resume;
        } catch {
          /* seek not allowed yet */
        }
      } else if (v.currentTime === 0) {
        try {
          v.currentTime = Math.min(0.1, (v.duration || 1) / 2);
        } catch {
          /* live stream — keep default frame */
        }
      }
      // Auto-enable captions if the user prefers them and a track exists.
      const tracks = readTracks(v);
      if (useVideoPrefs.getState().captionsPref && tracks.length > 0) {
        for (let i = 0; i < v.textTracks.length; i++) {
          v.textTracks[i].mode = i === tracks[0].index ? "showing" : "disabled";
        }
      }
      patch({
        duration: v.duration,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        textTracks: tracks,
        activeTextTrack: activeTrackIndex(v),
        error: "none",
      });
    };

    const onTimeUpdate = () => patch({ currentTime: v.currentTime });
    const onDurationChange = () => patch({ duration: v.duration });
    const onProgress = () => patch({ buffered: readBuffered(v) });
    const onPlay = () => patch({ playing: true });
    const onPause = () => patch({ playing: false });
    const onEnded = () => patch({ playing: false });
    const onVolume = () => {
      patch({ volume: v.volume, muted: v.muted });
      const st = useVideoPrefs.getState();
      st.setVolume(v.volume);
      st.setMuted(v.muted);
    };
    const onRate = () => {
      patch({ rate: v.playbackRate });
      useVideoPrefs.getState().setPlaybackRate(v.playbackRate);
    };
    const onWaiting = () => patch({ isBuffering: true });
    const onPlaying = () => patch({ isBuffering: false, error: "none" });
    const onCanPlay = () => patch({ isBuffering: false, buffered: readBuffered(v) });
    const onSeeking = () => patch({ isSeeking: true });
    const onSeeked = () =>
      patch({ isSeeking: false, isBuffering: false, currentTime: v.currentTime });
    const onError = () => patch({ error: classifyError(v) });
    const onEnterPip = () => patch({ pipActive: true });
    const onLeavePip = () => patch({ pipActive: false });
    const av = v as AirplayVideo;
    const supportsAirplay =
      typeof av.webkitShowPlaybackTargetPicker === "function";
    const onWirelessChange = () =>
      patch({ airplayActive: Boolean(av.webkitCurrentPlaybackTargetIsWireless) });
    // Cast via the standard Remote Playback API (Chromium: Chrome/Edge/Brave).
    // Shown whenever supported — NOT gated on a live device, so the button is
    // discoverable; prompt() handles the no-device case. Suppressed when the
    // WebKit AirPlay picker exists so Safari shows only the AirPlay button.
    const remote = v.remote;
    const supportsCast = !supportsAirplay && typeof remote?.prompt === "function";
    let castWatchId: number | null = null;
    const onRemoteState = () =>
      patch({ castActive: remote.state === "connected" });

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onProgress);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("volumechange", onVolume);
    v.addEventListener("ratechange", onRate);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("error", onError);
    v.addEventListener("enterpictureinpicture", onEnterPip);
    v.addEventListener("leavepictureinpicture", onLeavePip);
    patch({ airplaySupported: supportsAirplay, castSupported: supportsCast });
    if (supportsAirplay) {
      v.addEventListener(
        "webkitcurrentplaybacktargetiswirelesschanged",
        onWirelessChange,
      );
    }
    if (supportsCast) {
      // Kick off device discovery so a later prompt() has sinks ready —
      // Chromium's media router is lazy; without this the first prompt can
      // find nothing and reject immediately.
      if (typeof remote.watchAvailability === "function") {
        remote
          .watchAvailability(() => undefined)
          .then((id) => {
            castWatchId = id;
          })
          .catch(() => undefined);
      }
      remote.addEventListener("connect", onRemoteState);
      remote.addEventListener("connecting", onRemoteState);
      remote.addEventListener("disconnect", onRemoteState);
    }

    // Metadata may already be available (warm cache) — sync once.
    if (v.readyState >= 1) onLoadedMeta();

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("volumechange", onVolume);
      v.removeEventListener("ratechange", onRate);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onError);
      v.removeEventListener("enterpictureinpicture", onEnterPip);
      v.removeEventListener("leavepictureinpicture", onLeavePip);
      if (supportsAirplay) {
        v.removeEventListener(
          "webkitcurrentplaybacktargetiswirelesschanged",
          onWirelessChange,
        );
      }
      if (supportsCast) {
        if (castWatchId != null) {
          void remote.cancelWatchAvailability(castWatchId).catch(() => undefined);
        }
        remote.removeEventListener("connect", onRemoteState);
        remote.removeEventListener("connecting", onRemoteState);
        remote.removeEventListener("disconnect", onRemoteState);
      }
    };
  }, [videoRef, patch]);

  const actions = useMemo<PlayerActions>(() => {
    const el = () => videoRef.current;
    return {
      toggle() {
        const v = el();
        if (!v) return;
        if (v.paused) void v.play().catch(() => undefined);
        else v.pause();
      },
      play() {
        void el()?.play().catch(() => undefined);
      },
      pause() {
        el()?.pause();
      },
      seekTo(time) {
        const v = el();
        if (!v || !isScrubbable(v.duration)) return;
        v.currentTime = clamp(time, 0, v.duration);
      },
      seekBy(delta) {
        const v = el();
        if (!v) return;
        const max = isScrubbable(v.duration) ? v.duration : v.currentTime + delta;
        v.currentTime = clamp(v.currentTime + delta, 0, max);
      },
      seekToPercent(percent) {
        const v = el();
        if (!v || !isScrubbable(v.duration)) return;
        v.currentTime = (clamp(percent, 0, 100) / 100) * v.duration;
      },
      setVolume(volume) {
        const v = el();
        if (!v) return;
        const next = clamp(volume, 0, 1);
        v.muted = next === 0;
        v.volume = next;
      },
      nudgeVolume(delta) {
        const v = el();
        if (!v) return;
        v.muted = false;
        v.volume = clamp(v.volume + delta, 0, 1);
      },
      toggleMute() {
        const v = el();
        if (!v) return;
        v.muted = !v.muted;
      },
      setRate(rate) {
        const v = el();
        if (v) v.playbackRate = rate;
      },
      bumpRate(dir) {
        const v = el();
        if (!v) return;
        const idx = RATES.indexOf(
          RATES.reduce((a, b) =>
            Math.abs(b - v.playbackRate) < Math.abs(a - v.playbackRate) ? b : a,
          ),
        );
        const next = clamp(idx + dir, 0, RATES.length - 1);
        v.playbackRate = RATES[next];
      },
      toggleLoop() {
        const v = el();
        if (!v) return;
        v.loop = !v.loop;
        patch({ loop: v.loop });
      },
      stepFrame(dir) {
        const v = el();
        if (!v || !v.paused || !isScrubbable(v.duration)) return;
        v.currentTime = clamp(v.currentTime + dir * (1 / STEP_FPS), 0, v.duration);
      },
      setTextTrack(index) {
        const v = el();
        if (!v) return;
        for (let i = 0; i < v.textTracks.length; i++) {
          v.textTracks[i].mode = i === index ? "showing" : "disabled";
        }
        useVideoPrefs.getState().setCaptionsPref(index != null);
        patch({ activeTextTrack: index });
      },
      cycleCaptions() {
        const v = el();
        if (!v) return;
        const tracks = readTracks(v);
        if (tracks.length === 0) return;
        const order: (number | null)[] = [null, ...tracks.map((t) => t.index)];
        const current = activeTrackIndex(v);
        const pos = order.findIndex((o) => o === current);
        const next = order[(pos + 1) % order.length];
        for (let i = 0; i < v.textTracks.length; i++) {
          v.textTracks[i].mode = i === next ? "showing" : "disabled";
        }
        useVideoPrefs.getState().setCaptionsPref(next != null);
        patch({ activeTextTrack: next });
      },
      toggleAmbient() {
        setState((s) => {
          const ambientOn = !s.ambientOn;
          useVideoPrefs.getState().setAmbientOn(ambientOn);
          return { ...s, ambientOn };
        });
      },
      togglePip() {
        const v = el();
        if (!v) return;
        if (document.pictureInPictureElement) {
          void document.exitPictureInPicture().catch(() => undefined);
        } else {
          void v.requestPictureInPicture().catch(() => undefined);
        }
      },
      showAirplay() {
        (el() as AirplayVideo | null)?.webkitShowPlaybackTargetPicker?.();
      },
      showCast() {
        const r = el()?.remote;
        if (!r) return;
        const onFail = (err: unknown) => {
          const name = err instanceof DOMException ? err.name : "";
          // User dismissed the picker — not an error worth surfacing.
          if (name === "NotAllowedError" || name === "AbortError") return;
          // No sinks on the network (the usual "nothing happens" cause).
          if (name === "NotFoundError" || name === "NotSupportedError") {
            toast(t("preview.player.castNoDevices"));
          } else {
            toast.error(t("preview.player.castFailed"));
          }
        };
        try {
          const p = r.prompt();
          if (p && typeof p.catch === "function") p.catch(onFail);
        } catch (err) {
          onFail(err);
        }
      },
      reload() {
        const v = el();
        if (!v) return;
        resumeAtRef.current = v.currentTime;
        patch({ error: "none", isBuffering: true });
        onReload?.();
        // Same-URL transient retry; a fresh URL (onReload) reloads via the src change.
        try {
          v.load();
        } catch {
          /* ignore */
        }
      },
    };
  }, [videoRef, patch, onReload]);

  return { state, actions };
}
