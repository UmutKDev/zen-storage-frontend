/** Player-local pure helpers (time formatting, clamps, rate presets). */

/** Selectable playback-rate presets (the speed menu + `<`/`>` keys cycle these). */
export const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Assumed frame rate for `,`/`.` frame-stepping — a plain `<video>` doesn't
 *  expose the real fps, so this is an honest approximation. */
export const STEP_FPS = 30;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

/** A finite, non-negative duration (guards `Infinity`/`NaN` from live streams). */
export function isScrubbable(duration: number): boolean {
  return Number.isFinite(duration) && duration > 0;
}

/** `83` → `"1:23"`, `3723` → `"1:02:03"`. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** Spoken form for `aria-valuetext` (a raw seconds number is useless to AT). */
export function spokenTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0 seconds";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  parts.push(`${s} second${s === 1 ? "" : "s"}`);
  return parts.join(" ");
}
