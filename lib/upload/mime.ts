/**
 * MIME inference for uploads (upload-pipeline §6.6):
 * `file.type || mimeFromExtension(file.name) || "application/octet-stream"`.
 * The table covers the formats the product previews/edits plus the common
 * office/media set — everything else falls back to octet-stream.
 */

const MIME_BY_EXTENSION: Record<string, string> = {
  // text / code
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  xml: "application/xml",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  ts: "text/plain",
  // documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  bmp: "image/bmp",
  ico: "image/x-icon",
  // audio / video
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  // archives
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
};

export function mimeFromExtension(name: string): string | undefined {
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) return undefined;
  return MIME_BY_EXTENSION[name.slice(dot + 1).toLowerCase()];
}

/** Resolution order per the locked rule: File.type → extension → octet-stream. */
export function inferContentType(file: { name: string; type: string }): string {
  return (
    file.type || mimeFromExtension(file.name) || "application/octet-stream"
  );
}
