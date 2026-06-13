import React from "react";

/** Text input with optional label and hint/error. Solid surface, hairline border, orange focus ring. */
export function Input({ label, hint, error, id, className = "", style, ...rest }) {
  const inputId = id || (label ? "zs-in-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);
  const input = (
    <input
      id={inputId}
      className={`zs-input${className ? " " + className : ""}`}
      aria-invalid={error ? true : undefined}
      {...rest}
    />
  );
  if (!label && !hint && !error) return input;
  return (
    <div style={style}>
      {label ? (
        <label className="zs-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      {input}
      {error ? (
        <p className="zs-hint zs-hint--error">{error}</p>
      ) : hint ? (
        <p className="zs-hint">{hint}</p>
      ) : null}
    </div>
  );
}
