"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import type {
  FullscreenApi,
  HudContent,
  PlayerActions,
} from "../components/player/PlayerContext";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
}

/** Don't act behind an open menu / confirm dialog (lets them own arrow keys). */
function overlayOpen(): boolean {
  return Boolean(
    document.querySelector(
      '[role="menu"][data-state="open"], [role="alertdialog"]',
    ),
  );
}

/**
 * The player's keyboard map. A **capture-phase** `document` listener: on keys it
 * owns it `preventDefault()` + `stopPropagation()`, deterministically shadowing
 * the modal's bubble-phase `F` handler and `usePreviewNavigation`'s arrow handler
 * (no registration-order race). `Shift`+Arrow is intentionally left to bubble →
 * file navigation. Mounts only for video files, so there's no stale global key
 * handler for other viewers.
 */
export function useVideoKeyboard({
  videoRef,
  actions,
  fullscreen,
  flashHud,
  showControls,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  actions: PlayerActions;
  fullscreen: FullscreenApi;
  flashHud: (icon: HudContent["icon"], label: string) => void;
  showControls: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target) || overlayOpen()) return;

      const v = videoRef.current;
      let handled = true;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          actions.toggle();
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            handled = false;
            break;
          }
          actions.seekBy(-5);
          flashHud("back", "5s");
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            handled = false;
            break;
          }
          actions.seekBy(5);
          flashHud("forward", "5s");
          break;
        case "j":
        case "J":
          actions.seekBy(-10);
          flashHud("back", "10s");
          break;
        case "l":
        case "L":
          actions.seekBy(10);
          flashHud("forward", "10s");
          break;
        case "ArrowUp":
          actions.nudgeVolume(0.05);
          flashHud("volume", `${Math.round((v?.volume ?? 0) * 100)}%`);
          break;
        case "ArrowDown":
          actions.nudgeVolume(-0.05);
          flashHud("volume", `${Math.round((v?.volume ?? 0) * 100)}%`);
          break;
        case "m":
        case "M":
          actions.toggleMute();
          flashHud(v?.muted ? "mute" : "volume", v?.muted ? "Muted" : "Unmuted");
          break;
        case "f":
        case "F":
          fullscreen.toggle();
          break;
        case "c":
        case "C":
          actions.cycleCaptions();
          break;
        case ",":
          actions.stepFrame(-1);
          break;
        case ".":
          actions.stepFrame(1);
          break;
        case "<":
          actions.bumpRate(-1);
          flashHud("speed", `${v?.playbackRate ?? 1}×`);
          break;
        case ">":
          actions.bumpRate(1);
          flashHud("speed", `${v?.playbackRate ?? 1}×`);
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            actions.seekToPercent(Number(e.key) * 10);
          } else {
            handled = false;
          }
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        showControls();
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [videoRef, actions, fullscreen, flashHud, showControls]);
}
