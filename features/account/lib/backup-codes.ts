/**
 * Download backup codes as a plain-text file. Client-only DOM (no network).
 * Codes are shown once and never cached — this is the user's chance to save them.
 */
export function downloadBackupCodes(codes: ReadonlyArray<string>): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([`${codes.join("\n")}\n`], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "storage-backup-codes.txt";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
