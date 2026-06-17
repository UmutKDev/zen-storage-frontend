// Zen Storage UI kit — Teams management screen (solid cards, never glass).
const ZST = window.ZenStorageDesignSystem_33e1f8;

const ZS_TEAMS = [
  {
    id: "acme", name: "Acme Design", plan: "Team plan", role: "Owner", usedGB: 184, totalGB: 500, createdAt: "Jan 2025",
    members: [
      { name: "Umut Kaya", email: "umut@zenstorage.io", initials: "UK", role: "Owner" },
      { name: "Selin Arda", email: "selin@acme.co", initials: "SA", role: "Admin" },
      { name: "Deniz Yıldız", email: "deniz@acme.co", initials: "DY", role: "Member" },
      { name: "Mert Can", email: "mert@acme.co", initials: "MC", role: "Member" },
      { name: "Ece Tunç", email: "ece@acme.co", initials: "ET", role: "Member" },
    ],
  },
  {
    id: "lumen", name: "Lumen Labs", plan: "Team plan", role: "Admin", usedGB: 412, totalGB: 1000, createdAt: "Aug 2024",
    members: [
      { name: "Umut Kaya", email: "umut@zenstorage.io", initials: "UK", role: "Admin" },
      { name: "Kerem Şahin", email: "kerem@lumen.dev", initials: "KŞ", role: "Owner" },
      { name: "+10 others", email: "", initials: "", role: "Member" },
    ],
  },
  {
    id: "northwind", name: "Northwind Co.", plan: "Free plan", role: "Member", usedGB: 9.2, totalGB: 50, createdAt: "Mar 2026",
    members: [
      { name: "Umut Kaya", email: "umut@zenstorage.io", initials: "UK", role: "Member" },
      { name: "Ada Polat", email: "ada@northwind.co", initials: "AP", role: "Owner" },
      { name: "Berk Aksoy", email: "berk@northwind.co", initials: "BA", role: "Member" },
    ],
  },
  {
    id: "vela", name: "Vela Studio", plan: "Team plan", role: "Admin", usedGB: 256, totalGB: 500, createdAt: "Nov 2025",
    members: [
      { name: "Umut Kaya", email: "umut@zenstorage.io", initials: "UK", role: "Admin" },
      { name: "Cem Öztürk", email: "cem@vela.studio", initials: "CÖ", role: "Owner" },
      { name: "+6 others", email: "", initials: "", role: "Member" },
    ],
  },
  {
    id: "atlas", name: "Atlas Media", plan: "Free plan", role: "Member", usedGB: 31, totalGB: 50, createdAt: "Feb 2026",
    members: [
      { name: "Umut Kaya", email: "umut@zenstorage.io", initials: "UK", role: "Member" },
      { name: "Leyla Demir", email: "leyla@atlas.media", initials: "LD", role: "Owner" },
    ],
  },
];

const ZS_INVITES = [
  { id: "inv1", team: "Helios Group", invitedBy: "Mira Soylu", email: "mira@helios.group", role: "Member", when: "2 days ago", members: 8 },
  { id: "inv2", team: "Pixel Forge", invitedBy: "Tan Eren", email: "tan@pixelforge.io", role: "Admin", when: "5 days ago", members: 14 },
];

function TeamsScreen() {
  const { Card, Button, Badge, Icon, Avatar, Input, Tabs, Dialog } = ZST;
  const [activeId, setActiveId] = React.useState("acme");
  const [query, setQuery] = React.useState("");
  const [invites, setInvites] = React.useState(ZS_INVITES);
  const [tab, setTab] = React.useState("teams");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  React.useEffect(() => {
    if (!createOpen) return;
    setNewName("");
    setNewDesc("");
  }, [createOpen]);
  const team = ZS_TEAMS.find((t) => t.id === activeId) || ZS_TEAMS[0];
  const memberCount = (t) => t.members.reduce((n, m) => n + (m.initials ? 1 : (parseInt((m.name.match(/\d+/) || [0])[0], 10) || 0)), 0);
  const roleBadge = (role) =>
    role === "Owner" ? "default" : role === "Admin" ? "outline" : "secondary";
  const filtered = ZS_TEAMS.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));
  const dismissInvite = (id) => setInvites((list) => list.filter((iv) => iv.id !== id));
  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = "t" + Date.now();
    ZS_TEAMS.unshift({
      id, name, plan: "Free plan", role: "Owner", usedGB: 0, totalGB: 50,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      members: [{ name: "Umut Kaya", email: "umut@zenstorage.io", initials: "UK", role: "Owner" }],
    });
    setActiveId(id);
    setTab("teams");
    setQuery("");
    setCreateOpen(false);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 600, letterSpacing: "-0.01em" }}>Teams</h1>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>Manage the teams you belong to and their members.</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Icon name="plus" size={16} />Create team</Button>
        </div>

        <Tabs
          aria-label="Teams sections"
          variant="underline"
          tabs={[
            { value: "teams", label: "My teams" },
            { value: "invitations", label: invites.length ? `Invitations (${invites.length})` : "Invitations" },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "invitations" ? (
          invites.length > 0 ? (
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ display: "flex", color: "var(--primary)" }}><Icon name="mail" size={16} /></span>
              <h2 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, letterSpacing: "-0.01em" }}>Pending invitations</h2>
              <Badge variant="default">{invites.length}</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {invites.map((iv) => (
                <div key={iv.id} style={{
                  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                  padding: "10px 12px", borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, var(--primary) 5%, var(--background))",
                  border: "1px solid color-mix(in srgb, var(--primary) 14%, transparent)",
                }}>
                  <span style={{
                    display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center",
                    borderRadius: "var(--radius-md)", flexShrink: 0,
                    background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 14%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
                    color: "var(--primary)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 18%, transparent)",
                  }}>
                    <Icon name="users" size={18} />
                  </span>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, letterSpacing: "-0.01em" }}>{iv.team}</p>
                      <Badge variant={roleBadge(iv.role)}>{iv.role}</Badge>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Invited by {iv.invitedBy} · {iv.members} members · {iv.when}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Button variant="outline" size="sm" onClick={() => dismissInvite(iv.id)}>Decline</Button>
                    <Button size="sm" onClick={() => dismissInvite(iv.id)}><Icon name="check" size={16} />Accept</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          ) : (
          <Card style={{ padding: 36 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
              <span style={{ display: "flex", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <Icon name="mail" size={20} />
              </span>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>No pending invitations</p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>When someone invites you to a team, it'll show up here.</p>
            </div>
          </Card>
          )
        ) : null}

        {tab === "teams" ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 300px) 1fr", gap: 16, alignItems: "start" }}>
          {/* master: searchable team list */}
          <Card style={{ padding: 10 }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex", color: "var(--muted-foreground)", pointerEvents: "none" }}>
                <Icon name="search" size={15} />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams…"
                aria-label="Search teams"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 30px",
                  fontFamily: "inherit", fontSize: "var(--text-sm)", color: "var(--foreground)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                  background: "var(--background)", outline: "none",
                }}
              />
            </div>
            <div style={{
              display: "flex", flexDirection: "column", gap: 2,
              maxHeight: 420, overflowY: "auto", margin: "0 -4px", padding: "0 4px",
            }} role="listbox" aria-label="Teams">
              {filtered.length === 0 ? (
                <p style={{ margin: 0, padding: "16px 8px", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center" }}>No teams found.</p>
              ) : filtered.map((t) => {
                const isActive = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => setActiveId(t.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, textAlign: "left", width: "100%",
                      padding: "8px 10px", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "inherit",
                      border: "none",
                      background: isActive ? "color-mix(in srgb, var(--accent) 80%, transparent)" : "transparent",
                      boxShadow: isActive ? "inset 0 0 0 1px color-mix(in srgb, var(--foreground) 6%, transparent)" : "none",
                      transition: "background-color var(--duration-fast) var(--ease-standard)",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 45%, transparent)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                      borderRadius: "var(--radius-md)", flexShrink: 0,
                      background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 14%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
                      color: "var(--primary)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 18%, transparent)",
                    }}>
                      <Icon name="users" size={16} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: "var(--text-sm)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--foreground)" }}>{t.name}</span>
                      <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{memberCount(t)} members</span>
                    </span>
                    {isActive ? <span style={{ display: "flex", color: "var(--primary)" }}><Icon name="chevron-right" size={16} /></span> : null}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* detail */}
          <Card>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <span style={{
              display: "flex", width: 52, height: 52, alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-lg)", flexShrink: 0,
              background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 16%, transparent), color-mix(in srgb, var(--primary) 9%, transparent))",
              color: "var(--primary)",
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 20%, transparent)",
            }}>
              <Icon name="users" size={24} />
            </span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, letterSpacing: "-0.01em" }}>{team.name}</h2>
                <Badge variant={team.plan === "Free plan" ? "secondary" : "default"}>{team.plan}</Badge>
                <Badge variant={roleBadge(team.role)}>Your role: {team.role}</Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  <Icon name="users" size={14} />{memberCount(team)} members
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  <Icon name="calendar" size={14} />Created {team.createdAt}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                  <Icon name="hard-drive" size={14} />{team.usedGB} / {team.totalGB} GB
                </span>
              </div>
              {/* member avatar stack + storage bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {(() => {
                    const real = team.members.filter((m) => m.initials);
                    const placeholder = team.members.find((m) => !m.initials);
                    const extra = placeholder ? (parseInt((placeholder.name.match(/\d+/) || [0])[0], 10) || 0) : 0;
                    const shown = real.slice(0, 5);
                    const overflow = (real.length - shown.length) + extra;
                    return (
                      <React.Fragment>
                        {shown.map((m, i) => (
                          <span key={m.name + i} title={m.name} style={{ marginLeft: i === 0 ? 0 : -10, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card, var(--surface))" }}>
                            <Avatar initials={m.initials} size="sm" />
                          </span>
                        ))}
                        {overflow > 0 ? (
                          <span style={{ marginLeft: -10, display: "flex", width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--muted)", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 600, boxShadow: "0 0 0 2px var(--card, var(--surface))" }}>+{overflow}</span>
                        ) : null}
                      </React.Fragment>
                    );
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 160, maxWidth: 320 }}>
                  <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "color-mix(in srgb, var(--foreground) 8%, transparent)", overflow: "hidden" }}>
                    <div style={{
                      width: Math.min(100, Math.round((team.usedGB / team.totalGB) * 100)) + "%", height: "100%", borderRadius: "var(--radius-full)",
                      background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 80%, #ffffff), var(--primary))",
                      boxShadow: "0 0 6px 0 color-mix(in srgb, var(--primary) 45%, transparent)",
                    }}></div>
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{Math.round((team.usedGB / team.totalGB) * 100)}% of {team.totalGB} GB used</p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Button variant="outline" size="sm"><Icon name="settings" size={16} />Settings</Button>
              <Button size="sm"><Icon name="user-plus" size={16} />Invite member</Button>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "16px 0 4px" }}></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {team.members.map((m, i) => (
              <div key={m.name + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < team.members.length - 1 ? "1px solid var(--border)" : "none" }}>
                {m.initials ? (
                  <Avatar initials={m.initials} />
                ) : (
                  <span style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    <Icon name="users" size={16} />
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</p>
                  {m.email ? <p style={{ margin: "1px 0 0", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</p> : null}
                </div>
                <Badge variant={roleBadge(m.role)}>{m.role}</Badge>
                {m.email ? (
                  <Button variant="ghost" size="icon" aria-label="Member options"><Icon name="ellipsis" size={18} /></Button>
                ) : <span style={{ width: 36 }}></span>}
              </div>
            ))}
          </div>
        </Card>
        </div>
        ) : null}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a team"
        description="Spin up a shared workspace. You can invite members afterwards."
        footer={
          <React.Fragment>
            <Button size="sm" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={!newName.trim()} onClick={submitCreate}>Create team</Button>
          </React.Fragment>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); submitCreate(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Name"
            placeholder="e.g. Design Team"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div>
            <label className="zs-label" htmlFor="zs-newteam-desc">Description</label>
            <textarea
              id="zs-newteam-desc"
              className="zs-input"
              rows={3}
              placeholder="What is this team for? (optional)"
              spellCheck={false}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ resize: "vertical", minHeight: 72, fontFamily: "inherit" }}
            ></textarea>
          </div>
          <button type="submit" style={{ display: "none" }} aria-hidden="true"></button>
        </form>
      </Dialog>
    </div>
  );
}

window.ZSTeamsScreen = TeamsScreen;
