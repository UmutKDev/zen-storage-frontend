import React from "react";
import { formatBytes } from "./format.js";

/**
 * Storage quota bar (mirror of UsageBar.tsx). Brand fill; warning ≥80%,
 * danger at 100%/exceeded. Pinned at the bottom of the browser view.
 */
export function UsageBar({ used, max, label = "Storage" }) {
  const pct = Math.min(100, Math.max(0, Math.round((used / max) * 100)));
  const exceeded = pct >= 100;
  const near = pct >= 80;
  const fillClass = exceeded
    ? "zs-progress__fill zs-progress__fill--danger"
    : near
      ? "zs-progress__fill zs-progress__fill--warning"
      : "zs-progress__fill";
  return (
    <div className="zs-usage">
      <div className="zs-usage__row">
        <span className="zs-usage__label">{label}</span>
        <span className="zs-usage__meta">
          {formatBytes(used)} of {formatBytes(max)}
          {exceeded ? " · Limit exceeded" : near ? " · Near limit" : ""}
        </span>
      </div>
      <div
        className="zs-progress"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={fillClass} style={{ width: pct + "%" }}></div>
      </div>
    </div>
  );
}
