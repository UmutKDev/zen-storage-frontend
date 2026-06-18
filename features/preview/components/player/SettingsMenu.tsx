"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Check } from "lucide-react";
import { t } from "@/lib/i18n";
import { usePlayerContext } from "./PlayerContext";
import { RATES } from "./format";

/**
 * Settings popover (speed / captions / loop / ambient). A bespoke popover rather
 * than the Radix `DropdownMenu` because Radix portals to `document.body`, which
 * is invisible in browser fullscreen — this panel is a child of the player
 * container so it survives fullscreen. `role="menu"` + `data-state="open"` so the
 * player's capture-phase keyboard handler stands down while it's open.
 */
export function SettingsMenu() {
  const { state, actions } = usePlayerContext();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const hasTracks = state.textTracks.length > 0;
  const source =
    state.videoWidth && state.videoHeight
      ? `${state.videoWidth}×${state.videoHeight}`
      : null;

  return (
    <div className="zs-player__menu-root" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="zs-player__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("preview.player.settings")}
        onClick={() => setOpen((o) => !o)}
      >
        <Settings className="size-5" aria-hidden />
      </button>

      {open ? (
        <div
          className="zs-player__menu"
          role="menu"
          data-state="open"
          aria-label={t("preview.player.settings")}
        >
          {source ? (
            <p className="zs-player__menu-head">
              {t("preview.player.source")} · {source}
            </p>
          ) : null}

          <div
            className="zs-player__menu-section"
            role="group"
            aria-label={t("preview.player.speed")}
          >
            <span className="zs-player__menu-label">
              {t("preview.player.speed")}
            </span>
            <div className="zs-player__rate-grid">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="menuitemradio"
                  aria-checked={state.rate === r}
                  className="zs-player__rate-chip"
                  data-on={state.rate === r}
                  onClick={() => actions.setRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>

          {hasTracks ? (
            <div
              className="zs-player__menu-section"
              role="group"
              aria-label={t("preview.player.captions")}
            >
              <span className="zs-player__menu-label">
                {t("preview.player.captions")}
              </span>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={state.activeTextTrack === null}
                className="zs-player__menu-row"
                onClick={() => actions.setTextTrack(null)}
              >
                <span>{t("preview.player.captionsOff")}</span>
                {state.activeTextTrack === null ? (
                  <Check className="size-4" aria-hidden />
                ) : null}
              </button>
              {state.textTracks.map((tr) => (
                <button
                  key={tr.index}
                  type="button"
                  role="menuitemradio"
                  aria-checked={state.activeTextTrack === tr.index}
                  className="zs-player__menu-row"
                  onClick={() => actions.setTextTrack(tr.index)}
                >
                  <span>{tr.label}</span>
                  {state.activeTextTrack === tr.index ? (
                    <Check className="size-4" aria-hidden />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={state.loop}
            className="zs-player__menu-row"
            onClick={() => actions.toggleLoop()}
          >
            <span>{t("preview.player.loop")}</span>
            {state.loop ? <Check className="size-4" aria-hidden /> : null}
          </button>

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={state.ambientOn}
            className="zs-player__menu-row"
            onClick={() => actions.toggleAmbient()}
          >
            <span>{t("preview.player.ambient")}</span>
            {state.ambientOn ? <Check className="size-4" aria-hidden /> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
