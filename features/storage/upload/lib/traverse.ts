/**
 * Folder-drop traversal (upload-pipeline §4). `webkitGetAsEntry` is the only
 * cross-browser way to walk a dropped directory; per SUPPORTED-BROWSERS §5
 * it's desktop-only (the touch path is the Stage D bottom sheet). Output is a
 * flat list of files with their RELATIVE paths so the queue can recreate the
 * tree ("Photos/2026/a.jpg" → dirs ["Photos", "Photos/2026"] + leaf name).
 */

export interface TraversedFile {
  file: File;
  /** Folder chain relative to the drop root ("" for top-level files). */
  relativeDir: string;
}

function readEntries(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

function entryFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function walkEntry(
  entry: FileSystemEntry,
  dir: string,
  out: TraversedFile[],
): Promise<void> {
  if (entry.isFile) {
    out.push({ file: await entryFile(entry as FileSystemFileEntry), relativeDir: dir });
    return;
  }
  if (entry.isDirectory) {
    const childDir = dir ? `${dir}/${entry.name}` : entry.name;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries returns results in batches (~100) — drain until empty.
    for (;;) {
      const batch = await readEntries(reader);
      if (batch.length === 0) break;
      for (const child of batch) await walkEntry(child, childDir, out);
    }
  }
}

/** Files from a drop event — folders walked recursively when supported. */
export async function filesFromDataTransfer(
  data: DataTransfer,
): Promise<TraversedFile[]> {
  const out: TraversedFile[] = [];
  const items = Array.from(data.items ?? []);
  const entries = items
    .map((item) =>
      typeof item.webkitGetAsEntry === "function"
        ? item.webkitGetAsEntry()
        : null,
    )
    .filter((e): e is FileSystemEntry => e !== null);

  if (entries.length > 0) {
    for (const entry of entries) await walkEntry(entry, "", out);
    return out;
  }
  // Fallback (no entry API): plain files only, no folder recursion.
  return Array.from(data.files ?? []).map((file) => ({
    file,
    relativeDir: "",
  }));
}

/** Files picked via `<input webkitdirectory>` — relative dir from
 *  `webkitRelativePath` ("root/sub/a.txt" → "root/sub"). */
export function filesFromDirectoryInput(
  files: ArrayLike<File>,
): TraversedFile[] {
  return Array.from(files).map((file) => {
    const rel = file.webkitRelativePath;
    const lastSlash = rel.lastIndexOf("/");
    return { file, relativeDir: lastSlash === -1 ? "" : rel.slice(0, lastSlash) };
  });
}

/** Unique folder chains to create, shallowest first ("a/b" → ["a","a/b"]). */
export function directoriesToCreate(
  files: ReadonlyArray<TraversedFile>,
): string[] {
  const dirs = new Set<string>();
  for (const { relativeDir } of files) {
    if (!relativeDir) continue;
    const segments = relativeDir.split("/");
    for (let i = 1; i <= segments.length; i += 1) {
      dirs.add(segments.slice(0, i).join("/"));
    }
  }
  return [...dirs].sort((a, b) => a.split("/").length - b.split("/").length);
}
