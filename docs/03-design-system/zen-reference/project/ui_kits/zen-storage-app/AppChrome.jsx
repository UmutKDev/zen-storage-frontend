// Zen Storage UI kit — app shell: glass sidebar + glass topbar over solid base.
const ZS = window.ZenStorageDesignSystem_33e1f8;
const { Icon, Logo, Avatar, Button } = ZS;

function SidebarItem({ icon, label, active, collapsed, onClick }) {
  return (
    <a
      href="#"
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "10px 0" : "8px 12px",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-sm)", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap",
        color: active ? "var(--accent-foreground)" : "var(--muted-foreground)",
        background: active ? "color-mix(in srgb, var(--accent) 90%, transparent)" : "transparent",
        boxShadow: active
          ? "inset 0 1px 0 0 var(--glass-highlight), inset 0 0 0 1px color-mix(in srgb, var(--foreground) 5%, transparent)"
          : "none",
        transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 55%, transparent)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ display: "flex", color: active ? "var(--primary)" : "inherit" }}>
        <Icon name={icon} size={16} />
      </span>
      {collapsed ? null : <span>{label}</span>}
    </a>
  );
}

function CollapseToggle({ collapsed, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, flexShrink: 0,
        border: "none", borderRadius: "var(--radius-md)",
        background: "transparent", color: "var(--muted-foreground)", cursor: "pointer",
        transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 70%, transparent)"; e.currentTarget.style.color = "var(--foreground)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
    >
      <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={16} />
    </button>
  );
}

const ZS_WORKSPACES = [
  { id: "personal", name: "Personal", meta: "Free plan", icon: "folder", kind: "personal" },
  { id: "acme", name: "Acme Design", meta: "5 members", icon: "users", kind: "team" },
  { id: "lumen", name: "Lumen Labs", meta: "12 members", icon: "users", kind: "team" },
  { id: "northwind", name: "Northwind Co.", meta: "3 members", icon: "users", kind: "team" },
];

function WorkspaceSwitcher({ collapsed }) {
  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState("personal");
  const ref = React.useRef(null);
  const active = ZS_WORKSPACES.find((w) => w.id === activeId) || ZS_WORKSPACES[0];

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const dot = (w) => (
    <span style={{
      display: "flex", width: 26, height: 26, alignItems: "center", justifyContent: "center",
      borderRadius: "var(--radius-md)", flexShrink: 0,
      background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 14%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
      color: "var(--primary)",
      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 18%, transparent)",
    }}>
      <Icon name={w.icon} size={14} />
    </span>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Switch workspace"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? `${active.name} — ${active.meta}` : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-sm)",
          fontFamily: "inherit", cursor: "pointer", textAlign: "left", width: "100%",
          justifyContent: collapsed ? "center" : "flex-start",
          border: "1px solid color-mix(in srgb, var(--foreground) 7%, transparent)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface)", padding: collapsed ? "8px 0" : "8px 10px",
          boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--shadow-e1)",
          color: "var(--foreground)",
        }}
      >
        {dot(active)}
        {collapsed ? null : (
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis" }}>{active.name}</span>
            <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{active.meta}</span>
          </span>
        )}
        {collapsed ? null : (
          <span style={{ display: "flex", color: "var(--muted-foreground)" }}>
            <Icon name="chevrons-up-down" size={14} />
          </span>
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="glass-chrome"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0,
            width: collapsed ? 220 : "100%", minWidth: 220, zIndex: 50,
            border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
            background: "var(--popover, var(--surface))",
            boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--shadow-e3)",
            padding: 6, display: "flex", flexDirection: "column", gap: 2,
            transformOrigin: "top left", animation: "zs-menu-in var(--duration-fast) var(--ease-standard)",
          }}
        >
          <div style={{
            padding: "6px 10px 4px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "color-mix(in srgb, var(--muted-foreground) 75%, transparent)",
          }}>Workspace</div>
          {ZS_WORKSPACES.map((w, i) => {
            const isActive = w.id === activeId;
            const firstTeam = w.kind === "team" && ZS_WORKSPACES[i - 1] && ZS_WORKSPACES[i - 1].kind !== "team";
            return (
              <React.Fragment key={w.id}>
                {firstTeam ? <div style={{ height: 1, background: "var(--border)", margin: "4px 4px" }}></div> : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setActiveId(w.id); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 10px", border: "none", borderRadius: "var(--radius-md)",
                    background: isActive ? "color-mix(in srgb, var(--accent) 70%, transparent)" : "transparent",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    fontSize: "var(--text-sm)", color: "var(--foreground)",
                    transition: "background-color var(--duration-fast) var(--ease-standard)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 45%, transparent)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {dot(w)}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{w.meta}</span>
                  </span>
                  {isActive ? <span style={{ display: "flex", color: "var(--primary)" }}><Icon name="check" size={16} /></span> : null}
                </button>
              </React.Fragment>
            );
          })}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 4px" }}></div>
          <ProfileMenuItem icon="plus" label="Create team" onClick={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ nav, onNav, collapsed, onToggle }) {
  return (
    <aside className="glass-chrome" style={{
      position: "sticky", top: 0, height: "100vh", boxSizing: "border-box",
      width: collapsed ? 68 : 256, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 16, padding: collapsed ? "16px 10px" : 16,
      borderTop: "none", borderBottom: "none", borderLeft: "none",
      transition: "width var(--duration-base) var(--ease-standard), padding var(--duration-base) var(--ease-standard)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "4px 0 0",
        flexDirection: collapsed ? "column" : "row",
        justifyContent: collapsed ? "center" : "space-between",
      }}>
        <Logo wordmark={!collapsed} />
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      </div>
      <WorkspaceSwitcher collapsed={collapsed} />
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }} aria-label="Primary">
        {collapsed ? null : (
          <div style={{
            padding: "0 12px 6px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "color-mix(in srgb, var(--muted-foreground) 75%, transparent)",
          }}>Workspace</div>
        )}
        <SidebarItem icon="hard-drive" label="Storage" active={nav === "storage"} collapsed={collapsed} onClick={() => onNav("storage")} />
        <SidebarItem icon="users" label="Teams" active={nav === "teams"} collapsed={collapsed} onClick={() => onNav("teams")} />
        <SidebarItem icon="user" label="Account" active={nav === "account"} collapsed={collapsed} onClick={() => onNav("account")} />
        <SidebarItem icon="key-round" label="API keys" active={nav === "apikeys"} collapsed={collapsed} onClick={() => onNav("apikeys")} />
      </nav>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          title={collapsed ? "Free plan — 12.4 / 50 GB used" : undefined}
          style={{
            border: "1px solid color-mix(in srgb, var(--foreground) 7%, transparent)",
            borderRadius: "var(--radius-md)", background: "var(--surface)",
            boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--shadow-e1)",
            padding: collapsed ? "10px 8px" : "12px", display: "flex", flexDirection: "column", gap: 8,
          }}
        >
          {collapsed ? (
            <div style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>25%</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, color: "var(--foreground)" }}>Storage</span>
                <span style={{ display: "block", color: "var(--muted-foreground)" }}>Free plan</span>
              </span>
              <span style={{ color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>12.4 / 50 GB</span>
            </div>
          )}
          <div style={{ height: 5, borderRadius: "var(--radius-full)", background: "color-mix(in srgb, var(--foreground) 8%, transparent)", overflow: "hidden" }}>
            <div style={{
              width: "25%", height: "100%", borderRadius: "var(--radius-full)",
              background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 80%, #ffffff), var(--primary))",
              boxShadow: "0 0 6px 0 color-mix(in srgb, var(--primary) 45%, transparent)",
            }}></div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ProfileMenuItem({ icon, label, onClick, danger, trailing }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 10px", border: "none", borderRadius: "var(--radius-md)",
        background: "transparent", cursor: "pointer", textAlign: "left",
        fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 500,
        color: danger ? "var(--destructive)" : "var(--foreground)",
        transition: "background-color var(--duration-fast) var(--ease-standard)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "color-mix(in srgb, var(--destructive) 12%, transparent)" : "color-mix(in srgb, var(--accent) 70%, transparent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ display: "flex", color: danger ? "var(--destructive)" : "var(--muted-foreground)" }}>
        <Icon name={icon} size={16} />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {trailing ? <span style={{ display: "flex", color: "var(--muted-foreground)" }}>{trailing}</span> : null}
    </button>
  );
}

function ProfileMenu({ dark, onToggleTheme, onNavAccount, onSignOut }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const close = (fn) => () => { setOpen(false); fn && fn(); };
  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <button
        type="button"
        aria-label="Profile"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          border: "none", background: "none", padding: 0, cursor: "pointer", borderRadius: "50%",
          outline: open ? "2px solid color-mix(in srgb, var(--primary) 60%, transparent)" : "none", outlineOffset: 2,
        }}
      >
        <Avatar initials="UK" />
      </button>
      {open ? (
        <div
          role="menu"
          className="glass-chrome"
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0, width: 248, zIndex: 50,
            border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
            background: "var(--popover, var(--surface))",
            boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--shadow-e3)",
            padding: 6, display: "flex", flexDirection: "column", gap: 2,
            transformOrigin: "top right", animation: "zs-menu-in var(--duration-fast) var(--ease-standard)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 10px" }}>
            <Avatar initials="UK" />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: "var(--text-sm)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>Umut Kaya</span>
              <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>umut@zenstorage.io</span>
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "2px 4px" }}></div>
          <ProfileMenuItem icon="user" label="Account" onClick={close(onNavAccount)} />
          <ProfileMenuItem icon="users" label="My Teams" onClick={close()} />
          <div style={{ height: 1, background: "var(--border)", margin: "2px 4px" }}></div>
          <ProfileMenuItem icon="log-out" label="Sign out" danger onClick={close(onSignOut)} />
        </div>
      ) : null}
    </div>
  );
}

const ZS_NOTIFICATIONS = [
  { id: "n1", icon: "archive-restore", tone: "brand", title: "Extraction complete", body: "“backup-2026.zip” was extracted into a new folder.", time: "2m ago", unread: true },
  { id: "n2", icon: "upload", tone: "brand", title: "Upload finished", body: "12 files added to Photos.", time: "1h ago", unread: true },
  { id: "n3", icon: "user-plus", tone: "brand", title: "Team invite", body: "Defne invited you to Acme Design.", time: "3h ago", unread: true },
  { id: "n4", icon: "shield-check", tone: "success", title: "Antivirus scan clean", body: "No threats found across My storage.", time: "Yesterday", unread: false },
  { id: "n5", icon: "link", tone: "muted", title: "Share link viewed", body: "“quarterly-report.pdf” was opened 3 times.", time: "2d ago", unread: false },
];

function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(ZS_NOTIFICATIONS);
  const ref = React.useRef(null);
  const unread = items.filter((n) => n.unread).length;

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const markAllRead = () => setItems((list) => list.map((n) => ({ ...n, unread: false })));
  const markRead = (id) => setItems((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const toneColor = (t) =>
    t === "success" ? "var(--success, oklch(0.62 0.13 150))"
    : t === "brand" ? "var(--primary)"
    : "var(--muted-foreground)";

  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={"Notifications" + (unread ? " (" + unread + " unread)" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" size={18} />
      </Button>
      {unread > 0 ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute", top: -1, right: -1, minWidth: 15, height: 15, padding: "0 3px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxSizing: "border-box", borderRadius: "var(--radius-full)",
            background: "var(--primary)", color: "var(--primary-foreground)",
            fontSize: 9, fontWeight: 700, lineHeight: 1,
            boxShadow: "0 0 0 2px var(--surface, var(--background))",
            pointerEvents: "none",
          }}
        >
          {unread}
        </span>
      ) : null}
      {open ? (
        <div
          role="menu"
          className="glass-chrome"
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0, width: 348, zIndex: 50,
            border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
            background: "var(--popover, var(--surface))",
            boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--shadow-e3)",
            padding: 6, display: "flex", flexDirection: "column",
            transformOrigin: "top right", animation: "zs-menu-in var(--duration-fast) var(--ease-standard)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 8px" }}>
            <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", letterSpacing: "-0.01em" }}>Notifications</span>
            {unread > 0 ? (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{unread} new</span>
            ) : null}
            <span style={{ flex: 1 }}></span>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              style={{
                border: "none", background: "none", padding: "2px 4px", cursor: unread ? "pointer" : "default",
                fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 500,
                color: unread ? "var(--primary)" : "var(--muted-foreground)", opacity: unread ? 1 : 0.6,
              }}
            >
              Mark all read
            </button>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "0 4px 4px" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 360, overflowY: "auto" }}>
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                onClick={() => markRead(n.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left",
                  padding: "9px 10px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
                  fontFamily: "inherit",
                  background: n.unread ? "color-mix(in srgb, var(--accent) 55%, transparent)" : "transparent",
                  transition: "background-color var(--duration-fast) var(--ease-standard)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 80%, transparent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.unread ? "color-mix(in srgb, var(--accent) 55%, transparent)" : "transparent"; }}
              >
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
                  width: 30, height: 30, borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, " + toneColor(n.tone) + " 14%, transparent)",
                  color: toneColor(n.tone),
                }}>
                  <Icon name={n.icon} size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: n.unread ? 600 : 500, color: "var(--foreground)", letterSpacing: "-0.01em", flex: 1, minWidth: 0 }}>{n.title}</span>
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{n.time}</span>
                  </span>
                  <span style={{ display: "block", marginTop: 2, fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>{n.body}</span>
                </span>
                {n.unread ? (
                  <span aria-hidden="true" style={{ flex: "none", marginTop: 6, width: 7, height: 7, borderRadius: "var(--radius-full)", background: "var(--primary)" }}></span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Topbar({ dark, onToggleTheme, onOpenPalette, onNavAccount, onSignOut }) {
  return (
    <header className="glass-chrome" style={{
      position: "sticky", top: 0, zIndex: 30, height: 56, boxSizing: "border-box",
      display: "flex", alignItems: "center", gap: 8, padding: "0 16px",
      borderTop: "none", borderLeft: "none", borderRight: "none",
    }}>
      <button
        type="button"
        onClick={onOpenPalette}
        className="zs-btn zs-btn--outline zs-btn--sm"
        style={{ width: 260, justifyContent: "flex-start", color: "var(--muted-foreground)", fontWeight: 400, background: "var(--background)" }}
      >
        <Icon name="search" />
        <span style={{ flex: 1, textAlign: "left" }}>Search files…</span>
        <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", background: "var(--muted)" }}>⌘K</kbd>
      </button>
      <div style={{ flex: 1 }}></div>
      <NotificationBell />
      <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={onToggleTheme}>
        <Icon name={dark ? "sun" : "moon"} size={18} />
      </Button>
      <ProfileMenu dark={dark} onToggleTheme={onToggleTheme} onNavAccount={onNavAccount} onSignOut={onSignOut} />
    </header>
  );
}

Object.assign(window, { ZSSidebar: Sidebar, ZSTopbar: Topbar });
