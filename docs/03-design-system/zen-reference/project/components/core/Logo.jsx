import React from "react";

/**
 * Zen Storage brand mark — a lettermark tile ("S" on the primary orange square).
 * The product has no drawn logo asset; this recipe IS the logo.
 */
export function Logo({ wordmark = true, size = 32, className = "", ...rest }) {
  return (
    <span className={`zs-logo${className ? " " + className : ""}`} {...rest}>
      <span
        className="zs-logo__tile"
        style={size !== 32 ? { width: size, height: size, fontSize: size * 0.5 } : undefined}
        aria-hidden={wordmark ? "true" : undefined}
        aria-label={wordmark ? undefined : "Zen Storage"}
      >
        S
      </span>
      {wordmark ? <span className="zs-logo__word">Zen Storage</span> : null}
    </span>
  );
}
