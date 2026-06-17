import React from "react";

/** Loading placeholder block (pulse). Size it with style/className. */
export function Skeleton({ className = "", style, ...rest }) {
  return (
    <div
      className={`zs-skeleton${className ? " " + className : ""}`}
      style={style}
      aria-hidden="true"
      {...rest}
    ></div>
  );
}
