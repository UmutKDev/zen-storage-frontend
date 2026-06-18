"use client";

import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import type { FullscreenApi } from "../components/player/PlayerContext";

/** Older WebKit (Safari) element-fullscreen surface. */
interface WebkitEl extends HTMLElement {
  webkitRequestFullscreen?: () => void;
}
interface WebkitDoc extends Document {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => void;
}

function fsElement(): Element | null {
  if (typeof document === "undefined") return null;
  const d = document as WebkitDoc;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function fsSupported(): boolean {
  if (typeof document === "undefined") return false;
  const d = document as WebkitDoc;
  return Boolean(document.fullscreenEnabled || d.webkitFullscreenEnabled);
}

/**
 * Browser **Fullscreen API** on the player container (NOT the `<video>` and NOT
 * the dialog) — the control bar + ambient canvas must be DOM children of the
 * fullscreened element or they vanish. Hidden by the control bar when
 * unsupported (e.g. iPhone, which only fullscreens the bare video).
 */
export function useVideoFullscreen(
  containerRef: RefObject<HTMLElement | null>,
): FullscreenApi {
  const [active, setActive] = useState(false);
  const supported = fsSupported();

  useEffect(() => {
    const onChange = () => setActive(fsElement() === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [containerRef]);

  const toggle = useCallback(() => {
    const el = containerRef.current as WebkitEl | null;
    if (!el) return;
    if (fsElement()) {
      const d = document as WebkitDoc;
      if (document.exitFullscreen) void document.exitFullscreen().catch(() => undefined);
      else d.webkitExitFullscreen?.();
    } else if (el.requestFullscreen) {
      void el.requestFullscreen().catch(() => undefined);
    } else {
      el.webkitRequestFullscreen?.();
    }
  }, [containerRef]);

  return { active, supported, toggle };
}
