"use client";

import { useStorageUiStore } from "../../operations";
import { DuplicateScanPanel } from "./DuplicateScanPanel";

/**
 * Controller for the duplicate-scan dialog, mounted once in the storage surface
 * (mirrors `SecureFolderDialogs`). Always renders the panel so an in-progress /
 * completed scan survives closing + reopening the dialog; `key={path}` resets it
 * on folder navigation. The toolbar button + ⌘K command flip `storageUi.scanDialog`.
 */
export function DuplicateScanDialogs({ path }: { path: string }) {
  const open = useStorageUiStore((s) => s.scanDialog);
  const close = useStorageUiStore((s) => s.closeScanDialog);
  return (
    <DuplicateScanPanel
      key={path}
      path={path}
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    />
  );
}
