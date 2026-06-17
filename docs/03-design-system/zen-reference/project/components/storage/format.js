// Shared storage formatting helpers (mirror lib/utils in the production repo).

export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/**
 * Type metadata for a file/folder entry: lucide icon, human kind label, and
 * a tone class suffix (see .zs-tone-* in storage.css) for the tinted icon tile.
 */
export function fileMeta(name, kind) {
  if (kind === "dir") return { icon: "folder", label: "Folder", tone: "brand" };
  const ext = (name.includes(".") ? name.split(".").pop() : "").toLowerCase();
  const MAP = {
    pdf: { icon: "file-text", label: "PDF document", tone: "red" },
    doc: { icon: "file-text", label: "Word document", tone: "blue" },
    docx: { icon: "file-text", label: "Word document", tone: "blue" },
    txt: { icon: "file-text", label: "Plain text", tone: "slate" },
    md: { icon: "file-code", label: "Markdown", tone: "slate" },
    csv: { icon: "file-spreadsheet", label: "Spreadsheet", tone: "green" },
    xls: { icon: "file-spreadsheet", label: "Spreadsheet", tone: "green" },
    xlsx: { icon: "file-spreadsheet", label: "Spreadsheet", tone: "green" },
    zip: { icon: "file-archive", label: "Archive", tone: "amber" },
    rar: { icon: "file-archive", label: "Archive", tone: "amber" },
    "7z": { icon: "file-archive", label: "Archive", tone: "amber" },
    gz: { icon: "file-archive", label: "Archive", tone: "amber" },
    jpg: { icon: "image", label: "Image", tone: "teal" },
    jpeg: { icon: "image", label: "Image", tone: "teal" },
    png: { icon: "image", label: "Image", tone: "teal" },
    gif: { icon: "image", label: "Image", tone: "teal" },
    webp: { icon: "image", label: "Image", tone: "teal" },
    svg: { icon: "image", label: "Vector image", tone: "teal" },
    mp4: { icon: "film", label: "Video", tone: "violet" },
    mov: { icon: "film", label: "Video", tone: "violet" },
    webm: { icon: "film", label: "Video", tone: "violet" },
    mp3: { icon: "music", label: "Audio", tone: "violet" },
    wav: { icon: "music", label: "Audio", tone: "violet" },
  };
  return MAP[ext] || { icon: "file", label: ext ? ext.toUpperCase() + " file" : "File", tone: "slate" };
}

export function formatDate(input) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
