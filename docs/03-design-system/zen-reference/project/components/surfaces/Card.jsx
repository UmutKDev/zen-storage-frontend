import React from "react";

/** Solid content card — NEVER glass (content/data stay solid per the glass contract). */
export function Card({ title, description, children, className = "", style, ...rest }) {
  return (
    <div className={`zs-card${className ? " " + className : ""}`} style={style} {...rest}>
      {title || description ? (
        <div className="zs-card__header">
          {title ? <h3 className="zs-card__title">{title}</h3> : null}
          {description ? <p className="zs-card__description">{description}</p> : null}
        </div>
      ) : null}
      <div className="zs-card__content">{children}</div>
    </div>
  );
}
