"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Captions,
  Repeat,
  PictureInPicture2,
  Airplay,
  Cast,
  Maximize,
  Minimize,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { usePlayerContext } from "./PlayerContext";
import { Scrubber } from "./Scrubber";
import { VolumeControl } from "./VolumeControl";
import { SettingsMenu } from "./SettingsMenu";
import { formatTime, isScrubbable } from "./format";

/** The floating glass control bar: scrubber on top, transport + options below. */
export function PlayerControlBar() {
  const { state, actions, fullscreen, controls } = usePlayerContext();
  const captionsOn = state.activeTextTrack !== null;
  const timeLabel = isScrubbable(state.duration)
    ? `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
    : formatTime(state.currentTime);

  return (
    <div
      className="zs-player__controls"
      data-visible={controls.visible}
      onPointerMove={controls.show}
    >
      <div className="zs-player__scrim" aria-hidden />
      <div className="zs-player__bar">
        <Scrubber />
        <div className="zs-player__row">
          <div className="zs-player__cluster">
            <button
              type="button"
              className="zs-player__btn zs-player__btn--play"
              aria-label={state.playing ? t("preview.player.pause") : t("preview.player.play")}
              onClick={() => actions.toggle()}
            >
              {state.playing ? (
                <Pause className="size-5" aria-hidden />
              ) : (
                <Play className="size-5" aria-hidden />
              )}
            </button>
            <button
              type="button"
              className="zs-player__btn"
              aria-label={t("preview.player.back10")}
              onClick={() => actions.seekBy(-10)}
            >
              <SkipBack className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              className="zs-player__btn"
              aria-label={t("preview.player.forward10")}
              onClick={() => actions.seekBy(10)}
            >
              <SkipForward className="size-5" aria-hidden />
            </button>
            <VolumeControl />
            <span className="zs-player__time" aria-hidden>
              {timeLabel}
            </span>
          </div>

          <div className="zs-player__cluster">
            <button
              type="button"
              className="zs-player__rate"
              aria-label={t("preview.player.speed")}
              onClick={() => actions.bumpRate(1)}
            >
              {state.rate}×
            </button>
            {state.textTracks.length > 0 ? (
              <button
                type="button"
                className="zs-player__btn"
                aria-label={t("preview.player.captions")}
                aria-pressed={captionsOn}
                data-on={captionsOn}
                onClick={() => actions.cycleCaptions()}
              >
                <Captions className="size-5" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              className="zs-player__btn"
              aria-label={t("preview.player.loop")}
              aria-pressed={state.loop}
              data-on={state.loop}
              onClick={() => actions.toggleLoop()}
            >
              <Repeat className="size-5" aria-hidden />
            </button>
            {state.pipSupported ? (
              <button
                type="button"
                className="zs-player__btn"
                aria-label={t("preview.player.pip")}
                aria-pressed={state.pipActive}
                data-on={state.pipActive}
                onClick={() => actions.togglePip()}
              >
                <PictureInPicture2 className="size-5" aria-hidden />
              </button>
            ) : null}
            {state.airplaySupported ? (
              <button
                type="button"
                className="zs-player__btn"
                aria-label={t("preview.player.airplay")}
                aria-pressed={state.airplayActive}
                data-on={state.airplayActive}
                onClick={() => actions.showAirplay()}
              >
                <Airplay className="size-5" aria-hidden />
              </button>
            ) : null}
            {state.castSupported ? (
              <button
                type="button"
                className="zs-player__btn"
                aria-label={t("preview.player.cast")}
                aria-pressed={state.castActive}
                data-on={state.castActive}
                onClick={() => actions.showCast()}
              >
                <Cast className="size-5" aria-hidden />
              </button>
            ) : null}
            <SettingsMenu />
            {fullscreen.supported ? (
              <button
                type="button"
                className="zs-player__btn"
                aria-label={
                  fullscreen.active
                    ? t("preview.player.exitFullscreen")
                    : t("preview.player.fullscreen")
                }
                onClick={() => fullscreen.toggle()}
              >
                {fullscreen.active ? (
                  <Minimize className="size-5" aria-hidden />
                ) : (
                  <Maximize className="size-5" aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
