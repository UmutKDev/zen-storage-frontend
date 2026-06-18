"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { CloudObjectModel } from "@/service/models";
import { useVideoPlayer } from "../../hooks/useVideoPlayer";
import { useVideoFullscreen } from "../../hooks/useVideoFullscreen";
import { useVideoKeyboard } from "../../hooks/useVideoKeyboard";
import { useControlsVisibility } from "../../hooks/useControlsVisibility";
import {
  PlayerContextProvider,
  type HudContent,
  type PlayerContextValue,
} from "./PlayerContext";
import { AmbientGlow } from "./AmbientGlow";
import { CenterOverlay } from "./CenterOverlay";
import { PlayerControlBar } from "./PlayerControlBar";

const DOUBLE_CLICK_MS = 220;
const HUD_MS = 750;

/**
 * The premium custom video player. Built on a native `<video>` (no third-party
 * player lib) and wired through `PlayerContext`. Owns `videoRef` + `containerRef`
 * (the container is the Fullscreen API target so the control bar + ambient glow
 * stay visible in fullscreen). `onReload` re-fetches a fresh signed URL for the
 * mid-watch URL-expiry recovery path.
 *
 * ⚠ The `<video>` deliberately has NO `crossOrigin` — setting it would break
 * playback whenever the signed CDN omits `Access-Control-Allow-Origin`. The
 * ambient canvas works without it (display-only, tainted is fine).
 */
export function VideoPlayer({
  object,
  onReload,
}: {
  object: CloudObjectModel;
  onReload?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transient on-screen HUD pill (gesture feedback).
  const [hud, setHud] = useState<HudContent | null>(null);
  const hudNonce = useRef(0);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashHud = useCallback((icon: HudContent["icon"], label: string) => {
    hudNonce.current += 1;
    setHud({ icon, label, nonce: hudNonce.current });
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHud(null), HUD_MS);
  }, []);
  useEffect(() => () => clearTimeout(hudTimer.current), []);

  const { state, actions } = useVideoPlayer(videoRef, { onReload });
  const fullscreen = useVideoFullscreen(containerRef);
  const controls = useControlsVisibility({
    active: state.playing && state.error === "none",
  });
  useVideoKeyboard({
    videoRef,
    actions,
    fullscreen,
    flashHud,
    showControls: controls.show,
  });

  // Keep focus inside the fullscreened container so keys + Radix's trap behave.
  useEffect(() => {
    if (fullscreen.active) containerRef.current?.focus();
  }, [fullscreen.active]);

  // Single click toggles play; double click toggles fullscreen.
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSurfaceClick = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = undefined;
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = undefined;
      actions.toggle();
    }, DOUBLE_CLICK_MS);
  }, [actions]);
  const onSurfaceDoubleClick = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = undefined;
    }
    fullscreen.toggle();
  }, [fullscreen]);

  const ctx = useMemo<PlayerContextValue>(
    () => ({
      videoRef,
      containerRef,
      object,
      state,
      actions,
      fullscreen,
      controls,
      hud,
      flashHud,
    }),
    [object, state, actions, fullscreen, controls, hud, flashHud],
  );

  return (
    <PlayerContextProvider value={ctx}>
      <div
        ref={containerRef}
        className="zs-player"
        tabIndex={-1}
        data-controls={controls.visible}
        data-fs={fullscreen.active}
        onMouseMove={controls.show}
      >
        <AmbientGlow />
        {/* Captions come from embedded text tracks (toggled in the settings
            menu); no sidecar <track> is served — and a <track> would require
            crossOrigin, which would break the signed-CDN load. */}
        <video
          ref={videoRef}
          src={object.Path.Url}
          className="zs-player__video"
          playsInline
          preload="metadata"
        >
          {t("preview.video.codecUnsupported")}
        </video>
        <div
          className="zs-player__surface"
          onClick={onSurfaceClick}
          onDoubleClick={onSurfaceDoubleClick}
          aria-hidden
        />
        <CenterOverlay />
        <PlayerControlBar />
      </div>
    </PlayerContextProvider>
  );
}
