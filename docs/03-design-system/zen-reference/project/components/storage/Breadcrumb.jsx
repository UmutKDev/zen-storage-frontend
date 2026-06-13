import React from "react";
import { Icon } from "../core/Icon.jsx";

/**
 * Folder breadcrumb (mirror of BreadcrumbBar.tsx). Every crumb is a pill:
 * ancestors are quiet ghost pills that fill on hover; the current location
 * is a raised machined chip with a brand-tinted glyph — drive at root,
 * folder inside. First crumb is "My storage".
 */
export function Breadcrumb({ segments = [], onNavigate, rootLabel = "My storage" }) {
  const crumbs = [rootLabel, ...segments];
  return (
    <nav aria-label="Folders" className="zs-breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const isRoot = index === 0;
        const glyph = isRoot ? "hard-drive" : "folder";
        return (
          <React.Fragment key={index}>
            {index > 0 ? (
              <span className="zs-breadcrumb__sep" aria-hidden="true">
                <Icon name="chevron-right" size={13} strokeWidth={2.25} />
              </span>
            ) : null}
            {isLast ? (
              <span aria-current="page" className="zs-breadcrumb__current">
                <span className="zs-breadcrumb__glyph" aria-hidden="true">
                  <Icon name={glyph} size={13} />
                </span>
                {crumb}
              </span>
            ) : (
              <button
                type="button"
                className="zs-breadcrumb__link"
                onClick={() => onNavigate && onNavigate(index)}
              >
                {isRoot ? (
                  <span className="zs-breadcrumb__glyph" aria-hidden="true">
                    <Icon name={glyph} size={13} />
                  </span>
                ) : null}
                {crumb}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
