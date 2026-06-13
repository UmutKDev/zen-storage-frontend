// Zen Storage UI kit — command palette (⌘K, glass-overlay).
const ZSC = window.ZenStorageDesignSystem_33e1f8;

function CommandPalette({ open, onClose, onNavigate }) {
  const { Icon } = ZSC;
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    if (!open) setQuery("");
  }, [open]);
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  const items = [
    { icon: "folder", label: "Documents", hint: "Folder", path: "Documents" },
    { icon: "folder", label: "Projects", hint: "Folder", path: "Projects" },
    { icon: "folder", label: "Q2 launch", hint: "Projects", path: "Projects/Q2 launch" },
    { icon: "file", label: "quarterly-report.pdf", hint: "4.2 MB", path: "" },
    { icon: "upload", label: "Upload files", hint: "Action", path: null },
    { icon: "folder-plus", label: "New folder", hint: "Action", path: null },
  ].filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "15vh" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-overlay" role="dialog" aria-modal="true" aria-label="Command palette" style={{
        width: "100%", maxWidth: 560, borderRadius: "var(--radius-lg)", overflow: "hidden",
        boxShadow: "0 1px 0 0 var(--glass-border) inset, var(--shadow-e4)",
        animation: "zs-rise-in var(--duration-base) var(--ease-decelerate)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={16} style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and commands…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)" }}
          />
          <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted-foreground)" }}>esc</kbd>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", padding: 6 }}>
          {items.length === 0 ? (
            <p style={{ margin: 0, padding: "24px 0", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>No results</p>
          ) : (
            items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { if (item.path !== null) onNavigate(item.path); onClose(); }}
                style={{
                  display: "flex", width: "100%", alignItems: "center", gap: 12, boxSizing: "border-box",
                  padding: "10px 12px", border: "none", borderRadius: "var(--radius-md)",
                  background: "transparent", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--foreground)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Icon name={item.icon} size={16} style={{ color: item.icon === "folder" ? "var(--brand)" : "var(--muted-foreground)" }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{item.hint}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

window.ZSCommandPalette = CommandPalette;
