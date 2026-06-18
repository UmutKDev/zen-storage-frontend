"use client";

import { useEffect, useRef } from "react";
import { usePlayerContext } from "./PlayerContext";

function mq(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

/**
 * Cinematic ambient glow — a downscaled copy of the current frame, blurred and
 * scaled up behind the video (CSS does the bloom in `.zs-player__ambient`).
 *
 * Drawing the cross-origin `<video>` into the canvas **taints** it, which is fine
 * because we only ever DISPLAY the canvas (never `getImageData`/`toDataURL`), so
 * no CDN CORS headers are required. The draw loop prefers `requestVideoFrameCallback`
 * (auto-paced, paused while the video is paused) and falls back to a ~12fps
 * interval (Firefox). It no-ops while paused/backgrounded and is fully disabled
 * under reduced-motion / reduced-transparency.
 */
export function AmbientGlow() {
  const { videoRef, state } = usePlayerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!state.ambientOn) return;
    if (
      mq("(prefers-reduced-motion: reduce)") ||
      mq("(prefers-reduced-transparency: reduce)") ||
      mq("(prefers-contrast: more)")
    ) {
      return;
    }
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let stopped = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let rvfcHandle: number | undefined;

    const draw = () => {
      if (stopped) return;
      if (!v.paused && !v.ended && !document.hidden) {
        try {
          ctx.drawImage(v, 0, 0, c.width, c.height);
        } catch {
          /* frame not ready / tainted-display — safe to ignore */
        }
      }
    };

    if (typeof v.requestVideoFrameCallback === "function") {
      const loop = () => {
        if (stopped) return;
        draw();
        rvfcHandle = v.requestVideoFrameCallback?.(loop);
      };
      rvfcHandle = v.requestVideoFrameCallback(loop);
    } else {
      intervalId = setInterval(draw, 80);
    }

    return () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
      if (rvfcHandle != null && typeof v.cancelVideoFrameCallback === "function") {
        v.cancelVideoFrameCallback(rvfcHandle);
      }
    };
  }, [state.ambientOn, videoRef]);

  if (!state.ambientOn) return null;
  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={36}
      className="zs-player__ambient"
      aria-hidden
    />
  );
}
