import {
  File as FileIcon,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Music,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";

/**
 * Type metadata for a browse entry: a lucide icon, a resolved human label, and
 * a tone (drives the tinted `.zs-tile-icon` gradient via `.zs-tone-*`). Mirrors
 * the design system's `fileMeta` (docs/03-design-system/zen-reference/project/
 * components/storage/format.js) — color carries *type*, never decoration.
 */
export type FileTone =
  | "brand"
  | "red"
  | "blue"
  | "green"
  | "amber"
  | "teal"
  | "violet"
  | "slate";

export interface FileMeta {
  icon: LucideIcon;
  tone: FileTone;
  /** Already-resolved (i18n) label, e.g. "PDF document" / "BIN file". */
  label: string;
}

interface TypeDef {
  icon: LucideIcon;
  labelKey: string;
  tone: FileTone;
}

const TYPE_MAP: Record<string, TypeDef> = {
  pdf: { icon: FileText, labelKey: "storage.fileType.pdf", tone: "red" },
  doc: { icon: FileText, labelKey: "storage.fileType.word", tone: "blue" },
  docx: { icon: FileText, labelKey: "storage.fileType.word", tone: "blue" },
  txt: { icon: FileText, labelKey: "storage.fileType.text", tone: "slate" },
  md: { icon: FileCode, labelKey: "storage.fileType.markdown", tone: "slate" },
  csv: { icon: FileSpreadsheet, labelKey: "storage.fileType.spreadsheet", tone: "green" },
  xls: { icon: FileSpreadsheet, labelKey: "storage.fileType.spreadsheet", tone: "green" },
  xlsx: { icon: FileSpreadsheet, labelKey: "storage.fileType.spreadsheet", tone: "green" },
  zip: { icon: FileArchive, labelKey: "storage.fileType.archive", tone: "amber" },
  rar: { icon: FileArchive, labelKey: "storage.fileType.archive", tone: "amber" },
  "7z": { icon: FileArchive, labelKey: "storage.fileType.archive", tone: "amber" },
  gz: { icon: FileArchive, labelKey: "storage.fileType.archive", tone: "amber" },
  tar: { icon: FileArchive, labelKey: "storage.fileType.archive", tone: "amber" },
  jpg: { icon: ImageIcon, labelKey: "storage.fileType.image", tone: "teal" },
  jpeg: { icon: ImageIcon, labelKey: "storage.fileType.image", tone: "teal" },
  png: { icon: ImageIcon, labelKey: "storage.fileType.image", tone: "teal" },
  gif: { icon: ImageIcon, labelKey: "storage.fileType.image", tone: "teal" },
  webp: { icon: ImageIcon, labelKey: "storage.fileType.image", tone: "teal" },
  svg: { icon: ImageIcon, labelKey: "storage.fileType.vector", tone: "teal" },
  mp4: { icon: Film, labelKey: "storage.fileType.video", tone: "violet" },
  mov: { icon: Film, labelKey: "storage.fileType.video", tone: "violet" },
  webm: { icon: Film, labelKey: "storage.fileType.video", tone: "violet" },
  mp3: { icon: Music, labelKey: "storage.fileType.audio", tone: "violet" },
  wav: { icon: Music, labelKey: "storage.fileType.audio", tone: "violet" },
};

const TONE_CLASS: Record<FileTone, string> = {
  brand: "zs-tone-brand",
  red: "zs-tone-red",
  blue: "zs-tone-blue",
  green: "zs-tone-green",
  amber: "zs-tone-amber",
  teal: "zs-tone-teal",
  violet: "zs-tone-violet",
  slate: "zs-tone-slate",
};

const THUMBNAIL_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "mp4",
  "mov",
  "webm",
]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm"]);

/** The `.zs-tone-*` class for a tone (so callers never string-concat raw). */
export function toneClass(tone: FileTone): string {
  return TONE_CLASS[tone];
}

/** Lowercased extension (no dot), or "" when the name has none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** True for image/video files that should render as a full-bleed thumbnail. */
export function isThumbnailable(name: string): boolean {
  return THUMBNAIL_EXT.has(fileExtension(name));
}

/** True for video files (drives the play chip + duration affordance). */
export function isVideo(name: string): boolean {
  return VIDEO_EXT.has(fileExtension(name));
}

export function fileMeta(name: string, kind: "dir" | "file"): FileMeta {
  if (kind === "dir") {
    return { icon: Folder, tone: "brand", label: t("storage.fileType.folder") };
  }
  const ext = fileExtension(name);
  const def = TYPE_MAP[ext];
  if (def) return { icon: def.icon, tone: def.tone, label: t(def.labelKey) };
  return {
    icon: FileIcon,
    tone: "slate",
    label: ext
      ? `${ext.toUpperCase()} ${t("storage.fileType.fileSuffix")}`
      : t("storage.fileType.generic"),
  };
}
