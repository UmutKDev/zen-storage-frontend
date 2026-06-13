// Zen Storage UI kit — storage browser screen (list/grid, selection, bulk bar).
// Protected content: hidden entries stay invisible until the double-Shift (⇧⇧)
// gesture + password gate reveals them; encrypted folders prompt for a
// password on open (UnlockDialog). Demo password: "zen".
// Storage usage lives in the sidebar card only — never duplicated here.
const ZSS = window.ZenStorageDesignSystem_33e1f8;
const ZS_DEMO_PASSWORD = "zen";
// Grid tile size — user-adjustable via the toolbar slider, persisted locally.
const ZS_GRID_ROW_MIN = 132;
const ZS_GRID_ROW_MAX = 300;
const ZS_GRID_ROW_DEFAULT = 200;
const ZS_GRID_ROW_KEY = "zs-grid-row-height";
// Sort preferences — persisted locally, applied to both list and grid views.
const ZS_SORT_KEY_STORE = "zs-sort-key";
const ZS_SORT_DIR_STORE = "zs-sort-dir";
const ZS_SORT_FIELDS = [
  { key: "name", label: "Name", icon: "a-arrow-down" },
  { key: "size", label: "Size", icon: "scale" },
  { key: "modified", label: "Last modified", icon: "clock" },
  { key: "type", label: "Type", icon: "shapes" },
];
const ZS_EXT_OF = (e) => {
  if (e.kind === "dir") return "";
  const dot = e.name.lastIndexOf(".");
  return dot > 0 ? e.name.slice(dot + 1).toLowerCase() : "";
};

function StorageScreen({ path, onNavigate, onPreview }) {
  const { FileRow, FileTile, SmartGrid, Breadcrumb, BulkActionBar, Button, Icon, Tabs, Menu, Dialog, UploadDialog, UnlockDialog, NewFolderDialog, NewDocumentDialog, ArchiveDialog, ExtractDialog } = ZSS;
  const [view, setView] = React.useState("list");
  const [gridRowH, setGridRowH] = React.useState(() => {
    try {
      const v = parseInt(window.localStorage.getItem(ZS_GRID_ROW_KEY) || "", 10);
      if (Number.isFinite(v)) return Math.min(ZS_GRID_ROW_MAX, Math.max(ZS_GRID_ROW_MIN, v));
    } catch (err) { /* storage unavailable */ }
    return ZS_GRID_ROW_DEFAULT;
  });
  const changeGridRowH = (v) => {
    setGridRowH(v);
    try { window.localStorage.setItem(ZS_GRID_ROW_KEY, String(v)); } catch (err) { /* storage unavailable */ }
  };
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortKey, setSortKey] = React.useState(() => {
    try {
      const v = window.localStorage.getItem(ZS_SORT_KEY_STORE);
      if (ZS_SORT_FIELDS.some((f) => f.key === v)) return v;
    } catch (err) { /* storage unavailable */ }
    return "name";
  });
  const [sortDir, setSortDir] = React.useState(() => {
    try {
      const v = window.localStorage.getItem(ZS_SORT_DIR_STORE);
      if (v === "asc" || v === "desc") return v;
    } catch (err) { /* storage unavailable */ }
    return "asc";
  });
  const changeSort = (key, dir) => {
    setSortKey(key);
    setSortDir(dir);
    try {
      window.localStorage.setItem(ZS_SORT_KEY_STORE, key);
      window.localStorage.setItem(ZS_SORT_DIR_STORE, dir);
    } catch (err) { /* storage unavailable */ }
  };
  const [selected, setSelected] = React.useState({});
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [hiddenVisible, setHiddenVisible] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState({});
  // null | { variant: "hidden" } | { variant: "folder", entry, target }
  const [unlock, setUnlock] = React.useState(null);
  const [newOpen, setNewOpen] = React.useState(false);
  // Key of the entry whose row action menu is open (list view)
  const [actionMenu, setActionMenu] = React.useState(null);
  // Entry pending permanent deletion (no trash — always confirm first)
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  // null | "dir" | "doc" — which create dialog is showing
  const [createKind, setCreateKind] = React.useState(null);
  // Entries pending archive (single row action OR bulk selection)
  const [archive, setArchive] = React.useState(null); // null | { entries: Entry[] }
  // Extract queue — head runs with live inline progress, the rest wait in line
  const [extractQueue, setExtractQueue] = React.useState([]); // [{ key, dir, base, size, pick }]
  const [extractPct, setExtractPct] = React.useState(0);
  // Archives awaiting the extract confirmation dialog
  const [extractAsk, setExtractAsk] = React.useState(null); // null | { entries: Entry[] }
  const [, bumpData] = React.useReducer((n) => n + 1, 0);
  // Passwords for encrypted folders created this session (keyed by full path)
  const folderPw = React.useRef({});
  // Contents snapshots for archives created this session (keyed by full path)
  const archiveContents = React.useRef({});
  const lastShift = React.useRef(0);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setUploadOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Double-Shift (⇧⇧) toggles hidden items: revealing goes through the
  // password gate; hiding again is instant. Any other key resets the gesture.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Shift" || e.repeat) {
        lastShift.current = 0;
        return;
      }
      const now = Date.now();
      if (now - lastShift.current < 400) {
        lastShift.current = 0;
        if (unlock || uploadOpen) return;
        if (hiddenVisible) setHiddenVisible(false);
        else setUnlock({ variant: "hidden" });
      } else {
        lastShift.current = now;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hiddenVisible, unlock, uploadOpen]);

  const allEntries = window.ZS_DATA[path] || [];
  // Filter hidden entries, then order: folders before files (independent of
  // direction), sorted within each group by the active key + direction.
  const sortCmp = (a, b) => {
    let r = 0;
    if (sortKey === "size") r = (a.size || 0) - (b.size || 0);
    else if (sortKey === "modified") r = (a.modified || "").localeCompare(b.modified || "");
    else if (sortKey === "type") r = ZS_EXT_OF(a).localeCompare(ZS_EXT_OF(b));
    if (r === 0) r = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "desc" ? -r : r;
  };
  const entries = allEntries
    .filter((e) => !e.hidden || hiddenVisible)
    .slice()
    .sort((a, b) => (a.kind !== b.kind ? (a.kind === "dir" ? -1 : 1) : sortCmp(a, b)));
  const segments = path ? path.split("/") : [];

  const keyOf = (e) => (path ? path + "/" + e.name : e.name);
  const isLocked = (e) => !!e.locked && !unlocked[keyOf(e)];
  const count = Object.values(selected).filter(Boolean).length;
  const selectedEntries = entries.filter((e) => selected[keyOf(e)]);
  const canDownload = selectedEntries.some((e) => e.kind === "file");
  const toggle = (e) => setSelected((s) => ({ ...s, [keyOf(e)]: !s[keyOf(e)] }));
  const clear = () => setSelected({});
  const selectAll = () => {
    const all = {};
    entries.forEach((e) => { if (!isLocked(e)) all[keyOf(e)] = true; });
    setSelected(all);
  };
  const childCountOf = (e) => {
    if (e.kind !== "dir") return undefined;
    const children = window.ZS_DATA[path ? path + "/" + e.name : e.name];
    return children ? children.length : undefined;
  };
  React.useEffect(() => { setActionMenu(null); setConfirmDelete(null); setArchive(null); setExtractAsk(null); }, [path, view]);

  const open = (e) => {
    const target = keyOf(e);
    if (e.kind === "dir") {
      if (e.encrypted && !unlocked[target]) {
        setUnlock({ variant: "folder", entry: e, target });
        return;
      }
      clear();
      onNavigate(target);
    } else {
      onPreview(e);
    }
  };

  const destination = segments.length ? segments[segments.length - 1] : "Home";
  const today = new Date().toISOString().slice(0, 10);

  // ---- Row actions (list view "⋮" menu) ----
  const removeEntry = (e) => {
    window.ZS_DATA[path] = allEntries.filter((x) => x !== e);
    if (e.kind === "dir") delete window.ZS_DATA[keyOf(e)];
    setSelected((s) => { const n = { ...s }; delete n[keyOf(e)]; return n; });
    bumpData();
  };
  const duplicateEntry = (e) => {
    const names = new Set(allEntries.map((x) => x.name));
    const dot = e.name.lastIndexOf(".");
    const base = e.kind === "file" && dot > 0 ? e.name.slice(0, dot) : e.name;
    const ext = e.kind === "file" && dot > 0 ? e.name.slice(dot) : "";
    let final = base + " copy" + ext;
    let i = 2;
    while (names.has(final)) final = base + " copy " + i++ + ext;
    const copy = { ...e, name: final, modified: today };
    const idx = allEntries.indexOf(e);
    window.ZS_DATA[path] = [...allEntries.slice(0, idx + 1), copy, ...allEntries.slice(idx + 1)];
    if (e.kind === "dir") {
      window.ZS_DATA[path ? path + "/" + final : final] = [...(window.ZS_DATA[keyOf(e)] || [])];
    }
    bumpData();
  };
  const hideEntry = (e) => {
    e.hidden = true;
    bumpData();
  };
  const entryMenuItems = (e) => {
    const isDir = e.kind === "dir";
    return [
      isDir
        ? { icon: "folder-open", label: "Open", onSelect: () => open(e) }
        : { icon: "eye", label: "Preview", onSelect: () => open(e) },
      !isDir ? { icon: "download", label: "Download" } : null,
      isArchive(e)
        ? {
            icon: "archive-restore",
            label: "Extract",
            description: extractQueue.some((j) => j.key === keyOf(e))
              ? "Already in the extract queue"
              : "Into a new folder, here",
            disabled: extractQueue.some((j) => j.key === keyOf(e)),
            onSelect: () => setExtractAsk({ entries: [e] }),
          }
        : null,
      "separator",
      { icon: "pencil", label: "Rename", kbd: "F2" },
      { icon: "folder-input", label: "Move to…" },
      { icon: "copy", label: "Duplicate", onSelect: () => duplicateEntry(e) },
      { icon: "archive", label: "Archive…", description: ".zip · .tar · .tar.gz", onSelect: () => setArchive({ entries: [e] }) },
      "separator",
      // Hiding is a folder-level concept only (matches the ⇧⇧ reveal model).
      isDir
        ? {
            icon: "eye-off",
            label: "Hide folder",
            description: "Conceal — reveal with ⇧⇧",
            onSelect: () => hideEntry(e),
            disabled: e.hidden,
          }
        : null,
      isDir ? "separator" : null,
      { icon: "trash-2", label: "Delete…", kbd: "⌫", danger: true, onSelect: () => setConfirmDelete(e) },
    ].filter(Boolean);
  };
  const createDirectory = ({ name, encrypted, password, hidden }) => {
    const names = new Set(allEntries.map((e) => e.name));
    let final = name;
    let i = 2;
    while (names.has(final)) final = name + " " + i++;
    const target = path ? path + "/" + final : final;
    const entry = { name: final, kind: "dir", modified: today };
    if (encrypted) {
      entry.encrypted = true;
      entry.locked = true;
      folderPw.current[target] = password;
    }
    if (hidden) entry.hidden = true;
    window.ZS_DATA[path] = [entry, ...allEntries];
    window.ZS_DATA[target] = [];
    setCreateKind(null);
    bumpData();
  };
  const createDocument = ({ name, format }) => {
    const names = new Set(allEntries.map((e) => e.name));
    let final = name + "." + format;
    let i = 2;
    while (names.has(final)) final = name + "-" + i++ + "." + format;
    window.ZS_DATA[path] = [{ name: final, kind: "file", size: 0, modified: today }, ...allEntries];
    setCreateKind(null);
    bumpData();
  };
  // Recursive demo size: files report their own size, dirs sum their children.
  const sizeOfEntry = (e, base) => {
    if (e.kind === "file") return e.size || 0;
    const dirPath = base ? base + "/" + e.name : e.name;
    return (window.ZS_DATA[dirPath] || []).reduce((sum, k) => sum + sizeOfEntry(k, dirPath), 0);
  };
  const createArchive = ({ name, format }) => {
    if (!archive) return;
    const names = new Set(allEntries.map((e) => e.name));
    let final = name + "." + format;
    let i = 2;
    while (names.has(final)) final = name + "-" + i++ + "." + format;
    const raw = archive.entries.reduce((sum, e) => sum + sizeOfEntry(e, path), 0);
    const factor = format === "tar" ? 1 : 0.68; // zip/tar.gz compress, tar bundles as-is
    window.ZS_DATA[path] = [
      { name: final, kind: "file", size: Math.max(64, Math.round(raw * factor)), modified: today },
      ...allEntries,
    ];
    // Snapshot the contents so this archive can be extracted back later
    const tree = {};
    const walk = (list, fullBase, relBase) => {
      list.forEach((x) => {
        if (x.kind !== "dir") return;
        const full = fullBase ? fullBase + "/" + x.name : x.name;
        const rel = relBase ? relBase + "/" + x.name : x.name;
        const kids = (window.ZS_DATA[full] || []).map((k) => ({ ...k }));
        tree[rel] = kids;
        walk(kids, full, rel);
      });
    };
    walk(archive.entries, path, "");
    archiveContents.current[path ? path + "/" + final : final] = {
      entries: archive.entries.map((x) => ({ ...x })),
      tree,
    };
    setArchive(null);
    clear();
    bumpData();
  };

  // ---- Extract (archives → new folder, queued one at a time) ----
  const isArchive = (e) => e.kind === "file" && /\.(zip|tar|tar\.gz|tgz)$/i.test(e.name);
  // Known top-level contents: session snapshot, else seeded demo contents
  const contentsOf = (e) => {
    const key = keyOf(e);
    const snap = archiveContents.current[key] || (window.ZS_ARCHIVE_CONTENTS && window.ZS_ARCHIVE_CONTENTS[key]);
    return snap && snap.entries && snap.entries.length ? snap.entries : undefined;
  };
  const enqueueExtract = (e, pick) => {
    const key = keyOf(e);
    setExtractQueue((q) =>
      q.some((j) => j.key === key)
        ? q
        : [...q, { key, dir: path, base: e.name.replace(/\.(tar\.gz|tgz|zip|tar)$/i, ""), size: e.size || 0, pick }]
    );
  };
  const finishExtract = (job) => {
    const dirEntries = window.ZS_DATA[job.dir] || [];
    const names = new Set(dirEntries.map((x) => x.name));
    let dest = job.base;
    let i = 2;
    while (names.has(dest)) dest = job.base + " " + i++;
    const destPath = job.dir ? job.dir + "/" + dest : dest;
    const seeded = window.ZS_ARCHIVE_CONTENTS && window.ZS_ARCHIVE_CONTENTS[job.key];
    const snap = archiveContents.current[job.key] || seeded || { entries: [], tree: {} };
    let entries = snap.entries || [];
    let tree = snap.tree || {};
    if (job.pick) {
      const sel = new Set(job.pick);
      entries = entries.filter((x) => sel.has(x.name));
      tree = Object.fromEntries(Object.entries(tree).filter(([rel]) => sel.has(rel.split("/")[0])));
    }
    window.ZS_DATA[destPath] = entries.map((x) => ({ ...x }));
    Object.entries(tree).forEach(([rel, kids]) => {
      window.ZS_DATA[destPath + "/" + rel] = kids.map((k) => ({ ...k }));
    });
    // The extracted folder lands right below its archive
    const idx = dirEntries.findIndex((x) => (job.dir ? job.dir + "/" + x.name : x.name) === job.key);
    const folderEntry = { name: dest, kind: "dir", modified: today };
    window.ZS_DATA[job.dir] = [...dirEntries.slice(0, idx + 1), folderEntry, ...dirEntries.slice(idx + 1)];
    bumpData();
  };
  // Drive the head of the queue — one extraction at a time, sized by the archive
  const extractHeadKey = extractQueue.length ? extractQueue[0].key : null;
  React.useEffect(() => {
    if (!extractHeadKey) return undefined;
    const job = extractQueue[0];
    const duration = Math.min(8000, 900 + Math.sqrt(job.size || 0) / 4);
    const t0 = performance.now();
    setExtractPct(0);
    const tick = setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / duration) * 100);
      setExtractPct(p);
      if (p >= 100) {
        clearInterval(tick);
        finishExtract(job);
        setExtractQueue((q) => q.slice(1));
      }
    }, 80);
    return () => clearInterval(tick);
  }, [extractHeadKey]);
  const ordinal = (n) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th");
  const taskOf = (e) => {
    const idx = extractQueue.findIndex((j) => j.key === keyOf(e));
    if (idx === -1) return undefined;
    if (idx === 0) return { label: "Extracting…", progress: extractPct };
    return { label: idx === 1 ? "Queued — extracts next" : "Queued — " + ordinal(idx) + " in line" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 16, padding: 24, boxSizing: "border-box" }}>
      <style>{`
        /* Row action menus near the bottom of the list flip upward so the
         * list container's overflow:hidden doesn't clip them. */
        .zs-row-menu-up .zs-menu { top: auto; bottom: calc(100% + 6px); }
        /* Row separators move to the relative wrappers (rows are no longer siblings). */
        .zs-file-list .zs-file-row + .zs-file-row { border-top: none; }
        /* Tile-size slider (grid view only) */
        .zs-grid-zoom { display: flex; align-items: center; gap: 7px; padding: 0 4px; color: var(--muted-foreground); }
        .zs-grid-zoom input[type="range"] { -webkit-appearance: none; appearance: none; width: 84px; height: 20px; margin: 0; background: transparent; cursor: pointer; }
        .zs-grid-zoom input[type="range"]::-webkit-slider-runnable-track { height: 3px; border-radius: var(--radius-full); background: color-mix(in srgb, var(--foreground) 16%, transparent); }
        .zs-grid-zoom input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; margin-top: -5px; border-radius: var(--radius-full); background: var(--background); border: 1px solid color-mix(in srgb, var(--foreground) 30%, transparent); box-shadow: var(--shadow-e1); }
        .zs-grid-zoom input[type="range"]::-moz-range-track { height: 3px; border-radius: var(--radius-full); background: color-mix(in srgb, var(--foreground) 16%, transparent); }
        .zs-grid-zoom input[type="range"]::-moz-range-thumb { width: 13px; height: 13px; border-radius: var(--radius-full); background: var(--background); border: 1px solid color-mix(in srgb, var(--foreground) 30%, transparent); box-shadow: var(--shadow-e1); }
        .zs-grid-zoom input[type="range"]:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--ring); border-radius: var(--radius-full); }
      `}</style>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Breadcrumb
            segments={segments}
            onNavigate={(depth) => { clear(); onNavigate(segments.slice(0, depth).join("/")); }}
          />
          {hiddenVisible ? (
            <button
              type="button"
              title="Hidden items are visible — click or press Shift twice (⇧⇧) to conceal them again"
              onClick={() => setHiddenVisible(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                border: "1px dashed color-mix(in srgb, var(--foreground) 25%, transparent)",
                borderRadius: "var(--radius-full)",
                background: "color-mix(in srgb, var(--muted) 40%, transparent)",
                color: "var(--muted-foreground)",
                font: "inherit",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              <Icon name="eye" size={12} /> Hidden shown
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.8 }}>⇧⇧</span>
            </button>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="upload" size="sm" title="Upload files (⌘U)" onClick={() => setUploadOpen(true)}>
            <span className="zs-btn__well"><Icon name="upload" /></span>
            Upload
            <kbd className="zs-btn__kbd">⌘U</kbd>
          </Button>
          <div style={{ position: "relative" }}>
            <Button
              variant="outline"
              size="sm"
              aria-haspopup="menu"
              aria-expanded={newOpen}
              title="New directory or document"
              onClick={() => setNewOpen((o) => !o)}
            >
              <Icon name="plus" /> New <Icon name="chevron-down" size={13} style={{ marginLeft: -2, opacity: 0.7 }} />
            </Button>
            <Menu
              open={newOpen}
              onClose={() => setNewOpen(false)}
              align="end"
              items={[
                { icon: "folder-plus", label: "Directory", description: "Folder — optionally encrypted", onSelect: () => setCreateKind("dir") },
                { icon: "file-plus", label: "Document", description: "Plain text, Markdown, HTML…", onSelect: () => setCreateKind("doc") },
              ]}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Button
              variant="outline"
              size="sm"
              aria-label="Sort"
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              title={"Sort by " + (ZS_SORT_FIELDS.find((f) => f.key === sortKey) || {}).label + " · " + (sortDir === "asc" ? "ascending" : "descending")}
              onClick={() => setSortOpen((o) => !o)}
            >
              <Icon name="arrow-up-down" /> Sort <Icon name="chevron-down" size={13} style={{ marginLeft: -2, opacity: 0.7 }} />
            </Button>
            <Menu
              open={sortOpen}
              onClose={() => setSortOpen(false)}
              align="end"
              width={216}
              items={[
                ...ZS_SORT_FIELDS.map((f) => ({
                  icon: sortKey === f.key ? "check" : f.icon,
                  label: f.label,
                  onSelect: () => changeSort(f.key, sortDir),
                })),
                "separator",
                { icon: sortDir === "asc" ? "check" : "arrow-up-narrow-wide", label: "Ascending", onSelect: () => changeSort(sortKey, "asc") },
                { icon: sortDir === "desc" ? "check" : "arrow-down-wide-narrow", label: "Descending", onSelect: () => changeSort(sortKey, "desc") },
              ]}
            />
          </div>
          {view === "grid" ? (
            <label className="zs-grid-zoom" title="Tile size">
              <Icon name="image" size={11} />
              <input
                type="range"
                min={ZS_GRID_ROW_MIN}
                max={ZS_GRID_ROW_MAX}
                step={4}
                value={gridRowH}
                aria-label="Tile size"
                onChange={(ev) => changeGridRowH(Number(ev.target.value))}
              />
              <Icon name="image" size={17} />
            </label>
          ) : null}
          <Tabs
            aria-label="View"
            tabs={[
              { value: "list", icon: <Icon name="list" /> },
              { value: "grid", icon: <Icon name="layout-grid" /> },
            ]}
            value={view}
            onValueChange={setView}
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {entries.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "64px 0", color: "var(--muted-foreground)" }}>
            <Icon name="folder" size={32} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>This folder is empty</p>
            <Button variant="outline" size="sm" style={{ marginTop: 8 }} onClick={() => setUploadOpen(true)}><Icon name="upload" /> Upload files</Button>
          </div>
        ) : view === "list" ? (
          <div className="zs-file-list">
            <div className="zs-file-list__head" aria-hidden="true">
              <span className="zs-file-list__head-spacer"></span>
              <span className="zs-file-list__head-main">
                <span className="zs-file-list__head-name">Name</span>
                <span className="zs-file-list__head-size">Size</span>
                <span className="zs-file-list__head-date">Modified</span>
              </span>
              <span className="zs-file-list__head-actions"></span>
            </div>
            {entries.map((e, i) => (
              <div
                key={e.name}
                style={{
                  position: "relative",
                  zIndex: actionMenu === keyOf(e) ? 2 : undefined,
                  borderTop: i > 0 ? "1px solid color-mix(in srgb, var(--foreground) 5%, transparent)" : "none",
                }}
                className={i >= entries.length - 4 && entries.length > 6 ? "zs-row-menu-up" : undefined}
              >
                <FileRow
                  name={e.name}
                  kind={e.kind}
                  size={e.size}
                  modified={e.modified}
                  childCount={childCountOf(e)}
                  encrypted={e.encrypted}
                  hidden={e.hidden}
                  locked={isLocked(e)}
                  task={taskOf(e)}
                  selected={!!selected[keyOf(e)]}
                  selecting={count > 0}
                  onOpen={() => open(e)}
                  onToggleSelect={() => toggle(e)}
                  onAction={() => setActionMenu((k) => (k === keyOf(e) ? null : keyOf(e)))}
                  onDownload={() => {}}
                />
                <Menu
                  open={actionMenu === keyOf(e)}
                  onClose={() => setActionMenu(null)}
                  align="end"
                  width={244}
                  items={entryMenuItems(e)}
                />
              </div>
            ))}
          </div>
        ) : (
          <SmartGrid rowHeight={gridRowH}>
            {entries.map((e) => (
              <FileTile
                key={e.name}
                name={e.name}
                kind={e.kind}
                thumb={e.thumb}
                ratio={e.ratio}
                duration={e.duration}
                size={e.size}
                childCount={childCountOf(e)}
                encrypted={e.encrypted}
                hidden={e.hidden}
                locked={isLocked(e)}
                selected={!!selected[keyOf(e)]}
                selecting={count > 0}
                onOpen={() => open(e)}
                onToggleSelect={() => toggle(e)}
                onAction={() => {}}
              />
            ))}
          </SmartGrid>
        )}
      </div>

      {count > 0 ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <BulkActionBar
            count={count}
            allSelected={count >= entries.filter((e) => !isLocked(e)).length}
            canDownload={canDownload}
            onSelectAll={selectAll}
            onMove={clear}
            onArchive={() => setArchive({ entries: selectedEntries })}
            onExtract={
              selectedEntries.some(isArchive)
                ? () => setExtractAsk({ entries: selectedEntries.filter(isArchive) })
                : undefined
            }
            onDownload={clear}
            onDelete={clear}
            onClear={clear}
          />
        </div>
      ) : null}

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        destination={destination}
      />

      <NewFolderDialog
        open={createKind === "dir"}
        destination={destination}
        onClose={() => setCreateKind(null)}
        onCreate={createDirectory}
      />

      <NewDocumentDialog
        open={createKind === "doc"}
        destination={destination}
        onClose={() => setCreateKind(null)}
        onCreate={createDocument}
      />

      <ArchiveDialog
        open={!!archive}
        destination={destination}
        items={archive ? archive.entries.map((e) => e.name) : []}
        onClose={() => setArchive(null)}
        onArchive={createArchive}
      />

      <ExtractDialog
        open={!!extractAsk}
        destination={destination}
        items={extractAsk ? extractAsk.entries.map((e) => ({ name: e.name, size: e.size })) : []}
        contents={extractAsk && extractAsk.entries.length === 1 ? contentsOf(extractAsk.entries[0]) : undefined}
        onClose={() => setExtractAsk(null)}
        onExtract={({ selection }) => {
          extractAsk.entries.forEach((e) => enqueueExtract(e, selection));
          setExtractAsk(null);
          clear();
        }}
      />

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete ? `Delete ${confirmDelete.kind === "dir" ? "folder" : "file"}?` : undefined}
        description={
          confirmDelete
            ? `“${confirmDelete.name}”${
                confirmDelete.kind === "dir" ? " and everything inside it" : ""
              } will be deleted immediately. Zen Storage has no trash — this cannot be undone.`
            : undefined
        }
        footer={
          <React.Fragment>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { removeEntry(confirmDelete); setConfirmDelete(null); }}
            >
              <Icon name="trash-2" size={14} /> Delete permanently
            </Button>
          </React.Fragment>
        }
      />

      <UnlockDialog
        open={!!unlock}
        variant={unlock && unlock.variant === "hidden" ? "hidden" : "folder"}
        name={unlock && unlock.entry ? unlock.entry.name : undefined}
        hint={
          unlock && unlock.target && folderPw.current[unlock.target]
            ? "Enter the password you set when creating this folder."
            : 'Demo password: "' + ZS_DEMO_PASSWORD + '"'
        }
        verify={(pw) =>
          unlock && unlock.target && folderPw.current[unlock.target]
            ? pw === folderPw.current[unlock.target]
            : pw === ZS_DEMO_PASSWORD
        }
        onUnlock={() => {
          if (unlock && unlock.variant === "hidden") {
            setHiddenVisible(true);
          } else if (unlock) {
            setUnlocked((u) => ({ ...u, [unlock.target]: true }));
            clear();
            onNavigate(unlock.target);
          }
          setUnlock(null);
        }}
        onClose={() => setUnlock(null)}
      />
    </div>
  );
}

window.ZSStorageScreen = StorageScreen;
