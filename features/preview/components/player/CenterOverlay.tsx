"use client";

import {
  Play,
  Loader2,
  RotateCcw,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { HudContent } from "./PlayerContext";
import { usePlayerContext } from "./PlayerContext";

const HUD_ICONS: Record<HudContent["icon"], LucideIcon> = {
  forward: FastForward,
  back: Rewind,
  volume: Volume2,
  mute: VolumeX,
  speed: Gauge,
  play: Play,
  pause: Play,
};

/** Center stage layer: big play button (paused), buffering spinner, the
 *  error/reload panel, and the transient gesture HUD pill. Non-interactive by
 *  default — only the actual buttons capture pointer events. */
export function CenterOverlay() {
  const { state, actions, hud } = usePlayerContext();

  let body: React.ReactNode = null;

  if (state.error === "codec") {
    body = (
      <div className="zs-player__notice" role="alert">
        <p>{t("preview.video.codecUnsupported")}</p>
      </div>
    );
  } else if (state.error === "recoverable") {
    body = (
      <div className="zs-player__notice" role="alert">
        <p>{t("preview.player.errorBody")}</p>
        <button
          type="button"
          className="zs-player__reload"
          onClick={() => actions.reload()}
        >
          <RotateCcw className="size-4" aria-hidden />
          {t("preview.player.reload")}
        </button>
      </div>
    );
  } else if (state.isBuffering) {
    body = (
      <div className="zs-player__spinner" role="status" aria-live="polite">
        <Loader2 className="size-10 motion-safe:animate-spin" aria-hidden />
        <span className="sr-only">{t("preview.player.buffering")}</span>
      </div>
    );
  } else if (!state.playing) {
    body = (
      <button
        type="button"
        className="zs-player__bigplay"
        aria-label={t("preview.player.play")}
        onClick={() => actions.play()}
      >
        <Play className="size-9" aria-hidden />
      </button>
    );
  }

  const HudIcon = hud ? HUD_ICONS[hud.icon] : null;

  return (
    <div className="zs-player__center" aria-hidden={false}>
      {hud && HudIcon ? (
        <div key={hud.nonce} className="zs-player__hud" aria-hidden>
          <HudIcon className="size-4" />
          <span>{hud.label}</span>
        </div>
      ) : null}
      {body}
    </div>
  );
}
