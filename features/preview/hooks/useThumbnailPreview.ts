"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isScrubbable } from "../components/player/format";

/** Number of thumbnail "buckets" across the timeline — quantizing hover time to
 *  buckets stops micro-movements from re-seeking. */
const BUCKETS = 200;

/**
 * Live scrub-thumbnail preview. A hidden second `<video>` (lazily created on the
 * first hover, same signed URL — range requests are independent) is seeked to the
 * hovered time; each settled frame is blitted to a small `<canvas>` so the preview
 * never flickers while the source seeks ahead. Anti seek-storm: quantize to
 * buckets + an in-flight guard that applies only the latest desired time.
 *
 * Drawing the cross-origin frame taints the canvas — fine, we only display it,
 * never read pixels back — so no CDN CORS headers are needed.
 */
export function useThumbnailPreview(url: string, duration: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const desiredRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const [ready, setReady] = useState(false);

  const destroy = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.removeAttribute("src");
      try {
        v.load();
      } catch {
        /* ignore */
      }
    }
    videoRef.current = null;
    seekingRef.current = false;
    desiredRef.current = null;
  }, []);

  // Recreate the hidden element when the source changes; tear down on unmount.
  useEffect(() => destroy, [url, destroy]);

  const ensure = useCallback((): HTMLVideoElement => {
    if (videoRef.current) return videoRef.current;
    const v = document.createElement("video");
    v.src = url;
    v.muted = true;
    v.preload = "auto";
    v.playsInline = true;
    v.crossOrigin = null; // never CORS — would break the signed CDN load
    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      try {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        setReady(true);
      } catch {
        /* frame not ready */
      }
    };
    const onSeeked = () => {
      seekingRef.current = false;
      draw();
      if (desiredRef.current != null) {
        const next = desiredRef.current;
        desiredRef.current = null;
        seekingRef.current = true;
        try {
          v.currentTime = next;
        } catch {
          seekingRef.current = false;
        }
      }
    };
    v.addEventListener("seeked", onSeeked);
    videoRef.current = v;
    return v;
  }, [url]);

  /** Request a preview frame at `seconds` (bucket-quantized, debounced-to-latest). */
  const requestTime = useCallback(
    (seconds: number) => {
      if (!isScrubbable(duration)) return;
      const bucket = duration / BUCKETS;
      const quantized = Math.round(seconds / bucket) * bucket;
      const v = ensure();
      if (seekingRef.current) {
        desiredRef.current = quantized;
        return;
      }
      seekingRef.current = true;
      try {
        v.currentTime = quantized;
      } catch {
        seekingRef.current = false;
      }
    },
    [duration, ensure],
  );

  return { canvasRef, requestTime, ready };
}
