/**
 * Archive helpers for §6.3. `isExtractableArchive` mirrors the backend's
 * `GetArchiveFormat` (the formats it can actually open) — deliberately stricter
 * than `@/lib/utils` `ARCHIVE_EXT` (the icon set, which includes 7z/gz the
 * backend can't extract), so the per-row "Extract" affordance only appears on
 * archives the backend can process.
 */

// Longest suffixes first so `.tar.gz` wins over `.tar`.
const EXTRACTABLE_SUFFIXES = [
  ".tar.gz",
  ".tgz",
  ".zip",
  ".tar",
  ".rar",
] as const;

/** True when `name` is an archive the backend can extract. */
export function isExtractableArchive(name: string): boolean {
  const lower = name.toLowerCase();
  return EXTRACTABLE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

/**
 * The folder name the backend extracts an archive into — the file name minus its
 * archive extension (mirrors `BuildArchiveExtractPrefix`). Used to show the
 * extract target + warn about overwrites in the dialog.
 */
export function archiveExtractFolderName(name: string): string {
  const lower = name.toLowerCase();
  for (const suffix of EXTRACTABLE_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return name.slice(0, name.length - suffix.length) || name;
    }
  }
  return name;
}
