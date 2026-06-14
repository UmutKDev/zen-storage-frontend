"use client";

import { useEffect, useMemo } from "react";
import { Upload } from "lucide-react";
import { t } from "@/lib/i18n";
import { useShortcut, type Shortcut } from "@/lib/shortcuts";
import { Button } from "@/components/ui";
import { useUploadsStore } from "../stores/uploads.store";
import { UploadDialog } from "./UploadDialog";

/**
 * The storage browser's hero action — the single `upload` Button variant
 * (engraved icon well + ⌘U chip). Opens the premium UploadDialog, which feeds
 * the existing multipart queue + background tray. Exactly ONE per view.
 *
 * The dialog's open state lives in the uploads store so the background tray can
 * hide while the dialog is open (the dialog already shows the queue). ⌘U is
 * registered with the central shortcut dispatcher (storage scope) so it shows in
 * the help overlay and goes through the one keyboard handler.
 */
export function UploadButton({ path }: { path: string }) {
  const open = useUploadsStore((s) => s.dialogOpen);
  const setOpen = useUploadsStore((s) => s.setDialogOpen);

  useShortcut(
    useMemo<Shortcut>(
      () => ({
        id: "storage.upload",
        keys: "mod+u",
        scope: "storage",
        description: t("shortcuts.uploadFiles"),
        run: () => useUploadsStore.getState().setDialogOpen(true),
      }),
      [],
    ),
  );

  // Clear the shared flag if this button leaves the tree (e.g. navigating
  // away) so the tray isn't left hidden with no dialog on screen.
  useEffect(() => () => setOpen(false), [setOpen]);

  return (
    <>
      <Button
        variant="upload"
        size="sm"
        onClick={() => setOpen(true)}
        title={`${t("storage.upload.menu.button")} (⌘U)`}
      >
        <span className="zs-btn-upload__well" aria-hidden>
          <Upload />
        </span>
        {t("storage.upload.menu.button")}
        <kbd className="zs-btn-upload__kbd" aria-hidden>
          ⌘U
        </kbd>
      </Button>
      <UploadDialog path={path} open={open} onOpenChange={setOpen} />
    </>
  );
}
