"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { t } from "@/lib/i18n";
import { useThumbnailPreview } from "../../hooks/useThumbnailPreview";
import { usePlayerContext } from "./PlayerContext";
import { clamp, formatTime, isScrubbable, spokenTime } from "./format";

/** Timeline scrubber: buffered ranges + played fill + thumb, with a live hover
 *  thumbnail preview. `role="slider"` with human `aria-valuetext`. */
export function Scrubber() {
  const { object, state, actions, controls } = usePlayerContext();
  const { currentTime, duration, buffered } = state;
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<{ ratio: number; time: number } | null>(null);
  const scrubbable = isScrubbable(duration);
  const { canvasRef, requestTime, ready } = useThumbnailPreview(
    object.Path.Url,
    duration,
  );

  const ratioFromEvent = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  };

  const updateHover = (clientX: number) => {
    if (!scrubbable) return;
    const ratio = ratioFromEvent(clientX);
    const time = ratio * duration;
    setHover({ ratio, time });
    requestTime(time);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    const ratio = ratioFromEvent(e.clientX);
    actions.seekTo(ratio * duration);
    updateHover(e.clientX);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbable) return;
    if (dragging) actions.seekTo(ratioFromEvent(e.clientX) * duration);
    updateHover(e.clientX);
    controls.show();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // ←/→ are handled globally (capture); cover the rest when focused.
    switch (e.key) {
      case "Home":
        actions.seekTo(0);
        break;
      case "End":
        if (scrubbable) actions.seekTo(duration);
        break;
      case "PageUp":
        actions.seekBy(10);
        break;
      case "PageDown":
        actions.seekBy(-10);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const pct = scrubbable ? clamp(currentTime / duration, 0, 1) * 100 : 0;
  const hoverPct = hover ? hover.ratio * 100 : 0;

  return (
    <div
      ref={trackRef}
      className="zs-player__scrubber"
      role="slider"
      tabIndex={0}
      aria-label={t("preview.player.seek")}
      aria-valuemin={0}
      aria-valuemax={scrubbable ? Math.floor(duration) : 0}
      aria-valuenow={Math.floor(currentTime)}
      aria-valuetext={
        scrubbable
          ? `${spokenTime(currentTime)} of ${spokenTime(duration)}`
          : spokenTime(currentTime)
      }
      aria-disabled={!scrubbable}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => !dragging && setHover(null)}
      onKeyDown={onKeyDown}
    >
      <div className="zs-player__scrubber-track">
        {buffered.map((r, i) =>
          scrubbable ? (
            <span
              key={i}
              className="zs-player__scrubber-buffered"
              style={{
                left: `${(r.start / duration) * 100}%`,
                width: `${((r.end - r.start) / duration) * 100}%`,
              }}
            />
          ) : null,
        )}
        <span className="zs-player__scrubber-played" style={{ width: `${pct}%` }} />
        <span className="zs-player__scrubber-thumb" style={{ left: `${pct}%` }} />
      </div>

      {hover && scrubbable ? (
        <div
          className="zs-player__thumb-preview"
          style={{ left: `clamp(84px, ${hoverPct}%, calc(100% - 84px))` }}
          aria-hidden
        >
          <canvas
            ref={canvasRef}
            width={160}
            height={90}
            className="zs-player__thumb-canvas"
            data-ready={ready}
          />
          <span className="zs-player__thumb-time">{formatTime(hover.time)}</span>
        </div>
      ) : null}
    </div>
  );
}
