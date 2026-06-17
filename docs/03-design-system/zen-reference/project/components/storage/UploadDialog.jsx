import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { formatBytes, fileMeta } from "./format.js";

let zsUploadUid = 0;

/**
 * Premium upload surface. Opens from the `upload` Button variant (⌘U).
 * Machined emblem header → dropzone with engraved disc (files AND folders,
 * via browse or drag-and-drop) → queue with per-item encrypt→upload
 * lifecycle → encrypted footer. Dropped/picked folders collapse to a single
 * queue row (file count + aggregate size). Simulated lifecycle unless
 * simulate={false}.
 */
export function UploadDialog({ open, onClose, destination = "Home", initialItems, simulate = true }) {
  const [items, setItems] = React.useState([]);
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);
  const dragDepth = React.useRef(0);

  // Re-seed every time the dialog opens
  React.useEffect(() => {
    if (open) {
      dragDepth.current = 0;
      setOver(false);
      setItems((initialItems || []).map((it) => ({ id: ++zsUploadUid, progress: 0, status: "encrypting", ...it })));
    }
  }, [open]);

  // Simulated lifecycle: encrypting (0→14%) → uploading → done
  React.useEffect(() => {
    if (!open || !simulate) return undefined;
    const t = setInterval(() => {
      setItems((list) => {
        if (!list.some((it) => it.status !== "done")) return list;
        return list.map((it) => {
          if (it.status === "done") return it;
          const pace = it.status === "encrypting" ? 4 : 2 + 600 / Math.sqrt(Math.max(it.size || 1e6, 1e5));
          const p = Math.min(100, it.progress + pace * (0.6 + Math.random() * 0.8));
          if (it.status === "encrypting") {
            return p >= 14 ? { ...it, status: "uploading", progress: p } : { ...it, progress: p };
          }
          return { ...it, progress: p, status: p >= 100 ? "done" : "uploading" };
        });
      });
    }, 160);
    return () => clearInterval(t);
  }, [open, simulate]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const addFiles = (fileList) => {
    const next = Array.from(fileList || [])
      .filter((f) => f && f.name)
      .map((f) => ({ id: ++zsUploadUid, name: f.name, size: f.size, progress: 0, status: "encrypting" }));
    if (next.length) setItems((l) => [...l, ...next]);
  };
  // webkitdirectory picker returns a flat file list — collapse to one row per top-level folder
  const addFolderFiles = (fileList) => {
    const groups = new Map();
    for (const f of Array.from(fileList || [])) {
      const root = (f.webkitRelativePath || f.name).split("/")[0];
      const g = groups.get(root) || { count: 0, size: 0 };
      g.count += 1;
      g.size += f.size || 0;
      groups.set(root, g);
    }
    const next = Array.from(groups, ([name, g]) => ({
      id: ++zsUploadUid, kind: "folder", name, count: g.count, size: g.size, progress: 0, status: "encrypting",
    }));
    if (next.length) setItems((l) => [...l, ...next]);
  };
  // Drag-and-drop: walk directory entries so dropped folders also collapse to one row
  const walkEntry = (entry) => new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((f) => resolve({ count: 1, size: f.size || 0 }), () => resolve({ count: 0, size: 0 }));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const acc = { count: 0, size: 0 };
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (!entries.length) return resolve(acc);
          for (const child of entries) {
            const r = await walkEntry(child);
            acc.count += r.count;
            acc.size += r.size;
          }
          readBatch();
        }, () => resolve(acc));
      };
      readBatch();
    } else resolve({ count: 0, size: 0 });
  });
  const addDropped = (dataTransfer) => {
    const dtItems = Array.from(dataTransfer.items || []);
    const entries = dtItems.map((it) => (it.webkitGetAsEntry ? it.webkitGetAsEntry() : null));
    if (!entries.some((en) => en && en.isDirectory)) {
      addFiles(dataTransfer.files);
      return;
    }
    entries.forEach((entry, i) => {
      if (!entry) return;
      if (entry.isFile) {
        const f = dtItems[i].getAsFile();
        if (f) addFiles([f]);
      } else {
        const id = ++zsUploadUid;
        // Place the row immediately; fill in count/size when traversal finishes
        setItems((l) => [...l, { id, kind: "folder", name: entry.name, count: null, size: 0, progress: 0, status: "encrypting" }]);
        walkEntry(entry).then((r) => {
          setItems((l) => l.map((it) => (it.id === id ? { ...it, count: r.count, size: r.size } : it)));
        });
      }
    });
  };
  const remove = (id) => setItems((l) => l.filter((it) => it.id !== id));
  const browse = () => { if (inputRef.current) inputRef.current.click(); };
  const browseFolder = () => { if (folderInputRef.current) folderInputRef.current.click(); };

  const doneCount = items.filter((it) => it.status === "done").length;
  const allDone = items.length > 0 && doneCount === items.length;
  const totalSize = items.reduce((sum, it) => sum + (it.size || 0), 0);

  const statusLabel = (it) =>
    it.status === "encrypting" ? "Encrypting…" :
    it.status === "uploading" ? Math.round(it.progress) + "%" : "Uploaded";

  return (
    <div
      className="zs-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="zs-upload glass-overlay" role="dialog" aria-modal="true" aria-label="Upload files">
        <header className="zs-upload__head">
          <span className="zs-upload__emblem" aria-hidden="true"><Icon name="upload" size={18} /></span>
          <div className="zs-upload__heading">
            <h2 className="zs-upload__title">Upload files</h2>
            <p className="zs-upload__dest">
              To <strong>{destination}</strong>
              <span className="zs-upload__dot" aria-hidden="true"></span>
              <kbd className="zs-upload__key">⌘U</kbd>
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><Icon name="x" /></Button>
        </header>

        <div className="zs-upload__body">
          <div
            className={"zs-upload__drop" + (over ? " zs-upload__drop--over" : "")}
            role="button"
            tabIndex={0}
            aria-label="Drop files or folders here, or browse"
            onClick={browse}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); browse(); }
            }}
            onDragEnter={(e) => { e.preventDefault(); dragDepth.current += 1; setOver(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.preventDefault();
              dragDepth.current -= 1;
              if (dragDepth.current <= 0) { dragDepth.current = 0; setOver(false); }
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragDepth.current = 0;
              setOver(false);
              if (e.dataTransfer) addDropped(e.dataTransfer);
            }}
          >
            <span className="zs-upload__disc" aria-hidden="true"><Icon name="arrow-up" size={20} strokeWidth={2.25} /></span>
            <p className="zs-upload__cta">
              Drop files or folders here, or <span className="zs-upload__browse">browse</span>
            </p>
            <p className="zs-upload__hint">
              Up to 50 GB per file · encrypted on this device before upload
            </p>
            <button
              type="button"
              className="zs-upload__folder-link"
              onClick={(e) => { e.stopPropagation(); browseFolder(); }}
            >
              <Icon name="folder-up" size={13} /> Upload a folder
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              style={{ display: "none" }}
              onChange={(e) => { addFolderFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          {items.length > 0 ? (
            <ul className="zs-upload__queue">
              {items.map((it) => {
                const isFolder = it.kind === "folder";
                const meta = isFolder ? fileMeta(it.name, "dir") : fileMeta(it.name, "file");
                const sizeLabel = isFolder
                  ? (it.count == null ? "Scanning…" : it.count + (it.count === 1 ? " file" : " files") + " · " + formatBytes(it.size))
                  : formatBytes(it.size);
                return (
                  <li key={it.id} className={"zs-upload__item zs-tone-" + meta.tone}>
                    <span className="zs-upload__file-icon" aria-hidden="true"><Icon name={meta.icon} /></span>
                    <span className="zs-upload__file-text">
                      <span className="zs-upload__file-top">
                        <span className="zs-upload__file-name">{it.name}</span>
                        <span className="zs-upload__file-meta">{sizeLabel} · {statusLabel(it)}</span>
                      </span>
                      <span className="zs-upload__rail" aria-hidden="true">
                        <span
                          className={"zs-upload__fill" + (it.status === "done" ? " zs-upload__fill--done" : "")}
                          style={{ width: Math.max(it.progress, 2) + "%" }}
                        ></span>
                      </span>
                    </span>
                    <span className="zs-upload__file-state">
                      {it.status === "done" ? (
                        <span className="zs-upload__check" aria-label="Uploaded"><Icon name="check" size={12} strokeWidth={3} /></span>
                      ) : (
                        <Button variant="ghost" size="icon-sm" aria-label={"Cancel " + it.name} onClick={() => remove(it.id)}><Icon name="x" /></Button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <footer className="zs-upload__foot">
          <span className="zs-upload__cipher"><Icon name="shield-check" size={13} /> End-to-end encrypted</span>
          <div className="zs-upload__actions">
            {items.length > 0 ? (
              <span className="zs-upload__summary">{doneCount} of {items.length} uploaded · {formatBytes(totalSize)}</span>
            ) : null}
            <Button size="sm" variant={allDone ? "primary" : "outline"} onClick={onClose}>
              {allDone ? "Done" : items.length > 0 ? "Hide" : "Cancel"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
