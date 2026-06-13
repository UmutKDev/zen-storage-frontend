import React from "react";

/** Tabs — segmented (muted track, elevated active pill) or underline (text + accent bar). */
export function Tabs({ tabs, value, defaultValue, onValueChange, variant = "segmented", "aria-label": ariaLabel }) {
  const [internal, setInternal] = React.useState(defaultValue || (tabs[0] && tabs[0].value));
  const active = value !== undefined ? value : internal;
  const select = (v) => {
    if (value === undefined) setInternal(v);
    if (onValueChange) onValueChange(v);
  };
  return (
    <div className={"zs-tabs__list" + (variant === "underline" ? " zs-tabs__list--underline" : "")} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className="zs-tabs__trigger"
          onClick={() => select(tab.value)}
        >
          {tab.icon || null}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
