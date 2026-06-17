// Zen Storage UI kit — login screen (auth forms are SOLID, never glass).
const ZSL = window.ZenStorageDesignSystem_33e1f8;

function LoginScreen({ onSignIn }) {
  const { Logo, Input, Button } = ZSL;
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
      background: "var(--surface)", padding: 16, boxSizing: "border-box",
    }}>
      <Logo />
      <div style={{
        width: "100%", maxWidth: 400, boxSizing: "border-box",
        borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
        background: "var(--surface-elevated)", padding: 32, boxShadow: "var(--shadow-e2)",
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 600, letterSpacing: "-0.01em" }}>Sign in</h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>Welcome back to Zen Storage.</p>
        </div>
        <form
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
          onSubmit={(e) => { e.preventDefault(); onSignIn(); }}
        >
          <Input label="Email" type="email" defaultValue="umut@zenstorage.app" autoComplete="email" />
          <Input label="Password" type="password" defaultValue="demo-password" autoComplete="current-password" />
          <Button size="lg" type="submit" style={{ width: "100%" }}>Sign in</Button>
        </form>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <Button variant="link" size="sm" style={{ padding: 0, height: "auto" }}>Forgot password?</Button>
          <Button variant="link" size="sm" style={{ padding: 0, height: "auto" }}>Use a passkey</Button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
        No account? <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--primary)" }}>Create one</a>
      </p>
    </div>
  );
}

window.ZSLoginScreen = LoginScreen;
