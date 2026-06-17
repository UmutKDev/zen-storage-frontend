// Zen Storage UI kit — file preview: full lightbox shell (dark stage + details rail).
// Premium weight: near-fullscreen glass shell, e4 elevation, slow decelerate entrance,
// media on a true dark stage with zoom controls, technical metadata in the right rail.
const ZSP = window.ZenStorageDesignSystem_33e1f8;

const ZS_PREVIEW_KIND = {
  jpg: "JPEG image", jpeg: "JPEG image", png: "PNG image", gif: "GIF image",
  mp4: "MPEG-4 video", mov: "QuickTime video",
  pdf: "PDF document", md: "Markdown", txt: "Plain text",
  zip: "ZIP archive", docx: "Word document", xlsx: "Spreadsheet",
};

function ZSPreviewStyles() {
  return (
    <style>{`
      @keyframes zs-preview-shell-in {
        from { opacity: 0; transform: translateY(var(--distance-slide)) scale(0.975); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes zs-preview-backdrop-in {
        from { background-color: rgba(8, 8, 11, 0); }
        to   { background-color: rgba(8, 8, 11, 0.64); }
      }
    `}</style>
  );
}

function ZSDetailRow({ label, children, mono }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "7px 0" }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--foreground)", textAlign: "right",
        minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        fontFamily: mono ? "var(--font-mono)" : undefined,
      }}>{children}</span>
    </div>
  );
}

function PreviewModal({ file, onClose }) {
  const { Icon, Button, Menu, Dialog } = ZSP;
  const [zoom, setZoom] = React.useState(1);
  const [copied, setCopied] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [railOpen, setRailOpen] = React.useState(true);
  // No trash in Zen Storage — deletion always confirms first.
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => { setZoom(1); setCopied(false); setMenuOpen(false); setConfirmDelete(false); }, [file]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !menuOpen && !confirmDelete) {
        if (fullscreen) { setFullscreen(false); return; }
        onClose();
      }
      if ((e.key === "f" || e.key === "F") && !menuOpen && !confirmDelete && !e.metaKey && !e.ctrlKey) {
        setFullscreen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, menuOpen, confirmDelete, fullscreen]);

  if (!file) return null;

  const fmt = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.round(b / 1e3) + " KB");
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const kind = ZS_PREVIEW_KIND[ext] || "File";
  const isVideo = !!file.duration;
  const isImage = !!file.thumb && !isVideo;
  const hash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

  const copyHash = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(hash); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const railLabel = {
    fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted-foreground)", fontWeight: 500,
  };
  const stagePillBtn = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "none",
    background: "transparent", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: 0,
  };

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        backdropFilter: "blur(8px) saturate(120%)", WebkitBackdropFilter: "blur(8px) saturate(120%)",
        animation: "zs-preview-backdrop-in var(--duration-base) var(--ease-standard) both",
      }}
    >
      <ZSPreviewStyles />
      <div
        className="glass-overlay"
        role="dialog" aria-modal="true" aria-label={file.name}
        style={{
          width: fullscreen ? "100vw" : "min(1120px, calc(100vw - 48px))",
          height: fullscreen ? "100vh" : "min(720px, calc(100vh - 64px))",
          borderRadius: fullscreen ? 0 : "var(--radius-xl)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 1px 0 0 var(--glass-highlight) inset, var(--shadow-e4)",
          animation: "zs-preview-shell-in var(--duration-slow) var(--ease-decelerate) both",
          transition: "width var(--duration-base) var(--ease-standard), height var(--duration-base) var(--ease-standard), border-radius var(--duration-base) var(--ease-standard)",
        }}
      >
        {/* ---- Header ---- */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 14px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0,
            border: "1px solid var(--border)", background: "var(--surface)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)",
          }}>
            <Icon name={isVideo ? "film" : isImage ? "image" : "file"} size={18} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              {kind} · {fmt(file.size)}{file.duration ? ` · ${file.duration}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Button variant="ghost" size="icon-sm" aria-label="Share"><Icon name="link" /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Version history"><Icon name="history" /></Button>
            <div style={{ position: "relative" }}>
              <Button variant="ghost" size="icon-sm" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}><Icon name="more-vertical" /></Button>
              <Menu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                align="end"
                width={232}
                items={[
                  { icon: "pencil", label: "Rename", kbd: "F2" },
                  { icon: "folder-input", label: "Move to…" },
                  { icon: "copy", label: "Duplicate" },
                  "separator",
                  { icon: "lock", label: "Move to Vault", description: "Encrypted, passphrase required" },
                  "separator",
                  { icon: "trash-2", label: "Delete…", kbd: "⌫", danger: true, onSelect: () => setConfirmDelete(true) },
                ]}
              />
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={railOpen ? "Hide details" : "Show details"} aria-pressed={!railOpen} onClick={() => setRailOpen((o) => !o)}><Icon name={railOpen ? "panel-right-close" : "panel-right-open"} /></Button>
            <Button variant="ghost" size="icon-sm" aria-label={fullscreen ? "Exit full screen" : "Full screen"} aria-pressed={fullscreen} onClick={() => setFullscreen((v) => !v)}><Icon name={fullscreen ? "minimize" : "maximize"} /></Button>
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 6px" }}></div>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><Icon name="x" /></Button>
          </div>
        </div>

        {/* ---- Body: stage + details rail ---- */}
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          {/* Dark media stage */}
          <div style={{
            flex: 1, minWidth: 0, position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(110% 90% at 50% 0%, rgba(255,255,255,0.07), transparent 55%), #0b0b0d",
          }}>
            {file.thumb ? (
              <img
                src={file.thumb} alt={file.name} draggable={false}
                style={{
                  maxWidth: "calc(100% - 64px)", maxHeight: "calc(100% - 88px)",
                  objectFit: "contain", display: "block", borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-e3)",
                  transform: `scale(${zoom})`,
                  transition: "transform var(--duration-base) var(--ease-standard)",
                }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "rgba(255,255,255,0.45)" }}>
                <div style={{
                  width: 96, height: 96, borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="file" size={40} strokeWidth={1.25} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  .{ext} — no inline preview
                </span>
              </div>
            )}

            {isVideo ? (
              <button aria-label="Play" style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                width: 64, height: 64, borderRadius: "var(--radius-full)", cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.25)", background: "rgba(20,20,22,0.6)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>
                <Icon name="play" size={24} style={{ marginLeft: 3 }} />
              </button>
            ) : null}

            {isImage ? (
              <div style={{
                position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: 2, padding: "4px 6px",
                borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(20,20,22,0.66)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                boxShadow: "var(--shadow-e2)",
              }}>
                <button style={stagePillBtn} aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}><Icon name="zoom-out" size={15} /></button>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.85)", minWidth: 42, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Math.round(zoom * 100)}%</span>
                <button style={stagePillBtn} aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}><Icon name="zoom-in" size={15} /></button>
                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.16)", margin: "0 4px" }}></div>
                <button style={stagePillBtn} aria-label="Fit to screen" onClick={() => setZoom(1)}><Icon name="maximize" size={14} /></button>
              </div>
            ) : null}
          </div>

          {/* Details rail */}
          <div style={{
            width: railOpen ? 300 : 0, flexShrink: 0,
            borderLeft: railOpen ? "1px solid var(--border)" : "none",
            display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden",
            transition: "width var(--duration-base) var(--ease-standard)",
          }}>
            <div style={{ flex: 1, minHeight: 0, width: 300, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ ...railLabel, marginBottom: 6 }}>Details</div>
                <ZSDetailRow label="Type">{kind}</ZSDetailRow>
                <ZSDetailRow label="Size">{fmt(file.size)}</ZSDetailRow>
                <ZSDetailRow label="Modified">{file.modified}</ZSDetailRow>
                {file.duration ? <ZSDetailRow label="Duration">{file.duration}</ZSDetailRow> : null}
                <ZSDetailRow label="Owner">You</ZSDetailRow>
              </div>

              <div>
                <div style={{ ...railLabel, marginBottom: 8 }}>Integrity</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)",
                }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)" }}>
                    sha256:{hash}
                  </span>
                  <Button variant="ghost" size="icon-xs" aria-label="Copy checksum" onClick={copyHash}>
                    <Icon name={copied ? "check" : "copy"} size={13} style={copied ? { color: "var(--success)" } : undefined} />
                  </Button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-xs)", color: "var(--success)" }}>
                    <Icon name="shield-check" size={14} /> Scanned · no threats found
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    <Icon name="lock" size={14} /> Encrypted at rest · AES-256
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0, width: 300, padding: "14px 20px 18px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <Button variant="primary" style={{ width: "100%" }}>
                <Icon name="download" size={15} /> Download
              </Button>
              <Button variant="outline" style={{ width: "100%" }}>
                <Icon name="link" size={15} /> Copy share link
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete file?"
        description={`“${file.name}” will be deleted immediately. Zen Storage has no trash — this cannot be undone.`}
        footer={
          <React.Fragment>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => { setConfirmDelete(false); onClose(); }}>
              <Icon name="trash-2" size={14} /> Delete permanently
            </Button>
          </React.Fragment>
        }
      />
    </div>
  );
}

window.ZSPreviewModal = PreviewModal;
