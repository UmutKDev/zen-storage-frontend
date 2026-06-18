"use client";

import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { t } from "@/lib/i18n";
import { usePlayerContext } from "./PlayerContext";
import { clamp } from "./format";

/** Mute toggle + a hover/focus-expanding bespoke volume slider (no Slider
 *  primitive exists in the design system). */
export function VolumeControl() {
  const { state, actions } = usePlayerContext();
  const { volume, muted } = state;
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const level = muted ? 0 : volume;

  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  const setFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    actions.setVolume(clamp((clientX - rect.left) / rect.width, 0, 1));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setFromEvent(e.clientX);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) setFromEvent(e.clientX);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    actions.nudgeVolume(e.deltaY < 0 ? 0.05 : -0.05);
  };

  return (
    <div className="zs-player__volume" onWheel={onWheel}>
      <button
        type="button"
        className="zs-player__btn"
        aria-label={muted ? t("preview.player.unmute") : t("preview.player.mute")}
        aria-pressed={muted}
        onClick={() => actions.toggleMute()}
      >
        <Icon className="size-5" aria-hidden />
      </button>
      <div
        ref={trackRef}
        className="zs-player__volume-slider"
        role="slider"
        tabIndex={0}
        aria-label={t("preview.player.volume")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level * 100)}
        aria-valuetext={`${Math.round(level * 100)}%`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            actions.nudgeVolume(0.05);
            e.preventDefault();
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            actions.nudgeVolume(-0.05);
            e.preventDefault();
          }
        }}
      >
        <span className="zs-player__volume-track">
          <span
            className="zs-player__volume-fill"
            style={{ width: `${level * 100}%` }}
          />
          <span
            className="zs-player__volume-knob"
            style={{ left: `${level * 100}%` }}
          />
        </span>
      </div>
    </div>
  );
}
