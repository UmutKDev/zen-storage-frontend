// Zen Storage UI kit — Account · Security screen (solid cards, never glass).
const ZSA = window.ZenStorageDesignSystem_33e1f8;

function AccountScreen() {
  const { Card, Input, Button, Switch, Badge, Tabs, Icon, Avatar } = ZSA;
  const [tab, setTab] = React.useState("security");
  const [secTab, setSecTab] = React.useState("password");
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 600, letterSpacing: "-0.01em" }}>Account</h1>
        <Tabs
          aria-label="Account sections"
          variant="underline"
          tabs={[
            { value: "profile", label: "Profile" },
            { value: "security", label: "Security" },
            { value: "subscription", label: "Subscription" },
          ]}
          value={tab}
          onValueChange={setTab}
        />
        {tab === "profile" ? (
          <Card title="Profile" description="Avatar upload activates post-backend; read-only at MVP.">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <Avatar initials="UK" size="lg" />
              <div>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>Umut K.</p>
                <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>umut@zenstorage.app</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="Display name" defaultValue="Umut K." />
              <Input label="Email" type="email" defaultValue="umut@zenstorage.app" disabled />
              <Input label="Phone number" type="tel" defaultValue="+90 532 000 00 00" />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button size="sm">Save</Button>
              </div>
            </div>
          </Card>
        ) : null}
        {tab === "security" ? (
          <React.Fragment>
            <Tabs
              aria-label="Security sections"
              tabs={[
                { value: "password", label: "Password" },
                { value: "passkeys", label: "Passkeys" },
                { value: "twofactor", label: "Two-factor" },
                { value: "sessions", label: "Sessions" },
              ]}
              value={secTab}
              onValueChange={setSecTab}
            />
            {secTab === "password" ? (
            <Card title="Change password" description="Use at least 12 characters.">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input label="Current password" type="password" />
                <Input label="New password" type="password" />
                <Input label="Confirm new password" type="password" />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button size="sm">Update password</Button>
                </div>
              </div>
            </Card>
            ) : null}
            {secTab === "passkeys" ? (
            <Card title="Passkeys" description="Sign in with Face ID, Touch ID, or a hardware key — no password needed.">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { name: "MacBook Pro · Touch ID", meta: "Added Mar 4, 2026 · last used today" },
                  { name: "iPhone · Face ID", meta: "Added Mar 4, 2026 · last used 2 days ago" },
                ].map((p) => (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <Icon name="fingerprint" size={16} style={{ color: "var(--muted-foreground)" }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>{p.name}</p>
                      <p style={{ margin: "1px 0 0", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{p.meta}</p>
                    </div>
                    <Button variant="ghost-destructive" size="sm">Remove</Button>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12 }}>
                  <Button variant="outline" size="sm">Add passkey</Button>
                </div>
              </div>
            </Card>
            ) : null}
            {secTab === "twofactor" ? (
            <Card title="Two-factor authentication" description="Authenticator app (TOTP) with backup codes.">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge variant="success">Enabled</Badge>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>8 backup codes left</span>
                </div>
                <Switch defaultChecked aria-label="Two-factor authentication" />
              </div>
            </Card>
            ) : null}
            {secTab === "sessions" ? (
            <Card title="Sessions" description="Where you're signed in.">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { dev: "laptop", name: "MacBook Pro · Safari", meta: "Istanbul · 88.241.12.74 · current session", current: true },
                  { dev: "smartphone", name: "iPhone · Safari", meta: "Istanbul · 88.241.12.74 · 2 days ago" },
                  { dev: "monitor", name: "Windows · Edge", meta: "Ankara · 31.145.60.18 · May 12, 2026" },
                ].map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <Icon name={s.dev} size={16} style={{ color: "var(--muted-foreground)" }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>{s.name}</p>
                      <p style={{ margin: "1px 0 0", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{s.meta}</p>
                    </div>
                    {s.current ? <Badge variant="outline">This device</Badge> : <Button variant="ghost-destructive" size="sm">Revoke</Button>}
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12 }}>
                  <Button variant="ghost-destructive" size="sm">Sign out everywhere</Button>
                </div>
              </div>
            </Card>
            ) : null}
          </React.Fragment>
        ) : null}
        {tab === "subscription" ? (
          <Card title="Subscription" description="Pricing is a coming-soon showcase; no checkout at MVP.">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge variant="default">Pro</Badge>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>100 GB · renews Jul 1, 2026</span>
              </div>
              <Button variant="outline" size="sm" disabled>Manage</Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

window.ZSAccountScreen = AccountScreen;
