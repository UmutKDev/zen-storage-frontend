// Zen Storage UI kit — root app: login → shell(storage | account), palette, preview, theme.
function ZSApp() {
  const [signedIn, setSignedIn] = React.useState(() => localStorage.getItem("zs-kit-signed-in") === "1");
  const [nav, setNav] = React.useState("storage");
  const [path, setPath] = React.useState("");
  const [dark, setDark] = React.useState(() => localStorage.getItem("zs-kit-theme") === "dark");
  const [preview, setPreview] = React.useState(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(() => localStorage.getItem("zs-kit-sidebar") === "collapsed");

  React.useEffect(() => {
    localStorage.setItem("zs-kit-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("zs-kit-theme", dark ? "dark" : "light");
  }, [dark]);
  React.useEffect(() => {
    localStorage.setItem("zs-kit-signed-in", signedIn ? "1" : "0");
  }, [signedIn]);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!signedIn) return <window.ZSLoginScreen onSignIn={() => setSignedIn(true)} />;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
      <window.ZSSidebar
        nav={nav}
        onNav={(n) => { setNav(n === "apikeys" ? "account" : n); }}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <window.ZSTopbar
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          onOpenPalette={() => setPaletteOpen(true)}
          onNavAccount={() => setNav("account")}
          onSignOut={() => setSignedIn(false)}
        />
        {nav === "storage" ? (
          <window.ZSStorageScreen path={path} onNavigate={setPath} onPreview={setPreview} />
        ) : nav === "teams" ? (
          <window.ZSTeamsScreen />
        ) : (
          <window.ZSAccountScreen />
        )}
      </div>
      <window.ZSPreviewModal file={preview} onClose={() => setPreview(null)} />
      <window.ZSCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(p) => { setNav("storage"); setPath(p); }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ZSApp />);
